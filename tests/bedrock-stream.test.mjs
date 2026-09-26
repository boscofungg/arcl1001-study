import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBedrockStream } from '../lib/bedrock-stream.ts';

// Independent, bitwise reference CRC for fixture generation.
function crc(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let n = 0; n < 8; n++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}
const encode = (value) => Buffer.from(value, 'utf8');
function header(name, value, type = 7) {
  const key = encode(name);
  const bytes = typeof value === 'string' ? encode(value) : Buffer.from(value);
  const prefix = Buffer.from([key.length, ...key, type]);
  if (type !== 6 && type !== 7) return Buffer.concat([prefix, bytes]);
  const length = Buffer.alloc(2); length.writeUInt16BE(bytes.length);
  return Buffer.concat([prefix, length, bytes]);
}
function frame({ messageType = 'event', type = 'contentBlockDelta', payload = { delta: { text: '考古 🏛️' } }, extra = [] } = {}) {
  const metadata = Buffer.concat([header(':message-type', messageType), header(':event-type', type), ...extra]);
  const body = typeof payload === 'string' ? encode(payload) : encode(JSON.stringify(payload));
  const bytes = Buffer.alloc(16 + metadata.length + body.length);
  bytes.writeUInt32BE(bytes.length, 0); bytes.writeUInt32BE(metadata.length, 4);
  bytes.writeUInt32BE(crc(bytes.subarray(0, 8)), 8);
  metadata.copy(bytes, 12); body.copy(bytes, 12 + metadata.length);
  bytes.writeUInt32BE(crc(bytes.subarray(0, -4)), bytes.length - 4);
  return bytes;
}
function stream(chunks, onCancel) {
  return new ReadableStream({ start(c) { for (const chunk of chunks) c.enqueue(chunk); if (!onCancel) c.close(); }, cancel: onCancel });
}
async function collect(input) { const events = []; for await (const event of parseBedrockStream(input)) events.push(event); return events; }

test('Bedrock frames parse byte-by-byte and coalesced with UTF-8 intact', async () => {
  const bytes = Buffer.concat([frame(), frame({ type: 'messageStop', payload: { stopReason: 'end_turn' } })]);
  const expected = [{ type: 'contentBlockDelta', data: { delta: { text: '考古 🏛️' } } }, { type: 'messageStop', data: { stopReason: 'end_turn' } }];
  assert.deepEqual(await collect(stream([...bytes].map(n => Uint8Array.of(n)))), expected);
  assert.deepEqual(await collect(stream([bytes])), expected);
  for (let cut = 1; cut < bytes.length; cut++) assert.deepEqual(await collect(stream([bytes.subarray(0, cut), bytes.subarray(cut)])), expected);
});

test('Bedrock accepts all standard auxiliary header types', async () => {
  const extra = [0, 1, 2, 3, 4, 5, 6, 8, 9].map(type => header(`x-${type}`, Buffer.alloc(({ 0: 0, 1: 0, 2: 1, 3: 2, 4: 4, 5: 8, 6: 3, 8: 8, 9: 16 })[type]), type));
  assert.equal((await collect(stream([frame({ extra })]))).length, 1);
});

test('Bedrock rejects either CRC corruption', async () => {
  for (const index of [8, frame().length - 1]) {
    const bytes = frame(); bytes[index] ^= 1;
    await assert.rejects(collect(stream([bytes])), /malformed or incomplete/);
  }
});

test('Bedrock rejects truncated frames and invalid frame sizes', async () => {
  const bytes = frame();
  for (const length of [1, 11, 12, bytes.length - 1]) await assert.rejects(collect(stream([bytes.subarray(0, length)])), /malformed or incomplete/);
  for (const length of [15, 1024 * 1024 + 1]) {
    const prelude = Buffer.alloc(12); prelude.writeUInt32BE(length); prelude.writeUInt32BE(crc(prelude.subarray(0, 8)), 8);
    await assert.rejects(collect(stream([prelude])), /malformed or incomplete/);
  }
});

test('Bedrock rejects malformed headers and invalid JSON without leaking payload', async () => {
  for (const fixture of [
    frame({ extra: [header('x', [], 10)] }),
    frame({ extra: [header(':message-type', 'event')] }),
    frame({ extra: [Buffer.from([10, 120])] }),
    frame({ payload: 'private token malformed json' }),
    frame({ messageType: 'unknown' }),
  ]) await assert.rejects(collect(stream([fixture])), { message: 'The AI stream was malformed or incomplete.' });
});

test('Bedrock errors and exceptions use a fixed safe error', async () => {
  for (const messageType of ['error', 'exception']) await assert.rejects(collect(stream([frame({ messageType, payload: { message: 'secret provider details' } })])), { message: 'The AI stream reported an error.' });
});

test('Bedrock cancels and releases reader when consumer stops early or parser fails', async () => {
  for (const invalid of [false, true]) {
    let cancelled = false;
    const bytes = frame(); if (invalid) bytes[8] ^= 1;
    const input = stream([bytes], () => { cancelled = true; });
    if (invalid) await assert.rejects(collect(input));
    else for await (const event of parseBedrockStream(input)) { assert.equal(event.type, 'contentBlockDelta'); break; }
    assert.equal(cancelled, true); assert.equal(input.locked, false);
  }
});
