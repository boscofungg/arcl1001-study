import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSSE } from '../lib/sse.ts';

const encoder = new TextEncoder();
const collect = async (stream) => {
  const events = [];
  for await (const event of parseSSE(stream)) events.push(event);
  return events;
};

test('yields a reply before the upstream response ends', async () => {
  let source;
  const stream = new ReadableStream({ start(controller) { source = controller; } });
  const parser = parseSSE(stream);
  source.enqueue(encoder.encode('event: delta\ndata: first\n\n'));
  assert.deepEqual(await parser.next(), { done: false, value: { event: 'delta', data: 'first' } });
  const next = parser.next();
  await new Promise((resolve) => setTimeout(resolve, 10));
  source.enqueue(encoder.encode('data: second\n\n'));
  assert.deepEqual(await next, { done: false, value: { event: 'message', data: 'second' } });
  source.close();
  assert.equal((await parser.next()).done, true);
  assert.equal(stream.locked, false);
});

test('handles byte-split UTF-8, CRLF, comments, multiline data and final frames', async () => {
  const bytes = encoder.encode(': heartbeat\r\nevent: delta\r\ndata: 古代 🏺\r\ndata:  second line\r\n\r\ndata: last');
  const stream = new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  });
  assert.deepEqual(await collect(stream), [
    { event: 'delta', data: '古代 🏺\n second line' },
    { event: 'message', data: 'last' },
  ]);
});

test('handles bare CR separators, empty data and ignores frames without data', async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('event: unused\r\revent:\rdata\r\rdata: tail\r'));
      controller.close();
    },
  });
  assert.deepEqual(await collect(stream), [
    { event: 'message', data: '' },
    { event: 'message', data: 'tail' },
  ]);
});

test('cancels the source and releases its reader when the consumer exits', async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(encoder.encode('data: first\n\ndata: unread\n\n')); },
    cancel() { cancelled = true; },
  });
  for await (const event of parseSSE(stream)) {
    assert.equal(event.data, 'first');
    break;
  }
  assert.equal(cancelled, true);
  assert.equal(stream.locked, false);
});

test('propagates upstream errors and releases the reader', async () => {
  const stream = new ReadableStream({
    start(controller) { controller.error(new Error('network disconnected')); },
  });
  await assert.rejects(collect(stream), /network disconnected/);
  assert.equal(stream.locked, false);
});
