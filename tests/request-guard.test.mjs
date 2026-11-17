import test from 'node:test';
import assert from 'node:assert/strict';
import { sameOriginError, allowRequest } from '../lib/request-guard.ts';
import { redact } from '../lib/server-log.ts';

const request = headers => new Request('https://study.example/api/chat', { method: 'POST', headers });

test('same-origin browser requests pass; scripts and other sites are refused', () => {
  assert.equal(sameOriginError(request({ origin: 'https://study.example' })), null);
  assert.equal(sameOriginError(request({ 'sec-fetch-site': 'same-origin' })), null);
  assert.equal(sameOriginError(request({})), 'forbidden');
  assert.equal(sameOriginError(request({ origin: 'https://evil.example' })), 'forbidden');
  assert.equal(sameOriginError(request({ origin: 'https://study.example', 'sec-fetch-site': 'cross-site' })), 'forbidden');
  assert.equal(sameOriginError(request({ origin: 'not a url' })), 'invalid');
});

test('rate window allows the limit per minute, then resets', () => {
  const window = new Map();
  for (let i = 0; i < 3; i++) assert.equal(allowRequest(window, 'a', 3, 1000), true);
  assert.equal(allowRequest(window, 'a', 3, 1000), false);
  assert.equal(allowRequest(window, 'b', 3, 1000), true);
  assert.equal(allowRequest(window, 'a', 3, 61001), true);
});

test('log redaction removes HKU keys and endpoints', () => {
  const text = redact('failed https://api.hku.hk/claude/student/model/x/converse?subscription-key=SECRET123 and ?key=abc');
  assert.ok(!text.includes('SECRET123'));
  assert.ok(!text.includes('abc'));
  assert.ok(!text.includes('api.hku.hk'));
});
