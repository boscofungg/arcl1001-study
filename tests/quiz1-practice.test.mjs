import test from 'node:test';
import assert from 'node:assert/strict';
import bank from '../content/quiz1-question-bank.json' with { type: 'json' };
import documents from '../lib/documents.json' with { type: 'json' };
import { makeQuiz1Set, parseQuiz1Review, rateQuiz1, retryQuiz1 } from '../lib/quiz1-practice.ts';
const fixture = ['image', 'map', 'short-answer', 'comparison'].flatMap(kind => Array.from({ length: 4 }, (_, i) => ({ id: `${kind}-${i}`, kind })));

test('mixed sample sets cover every available type with unique questions', () => {
  const set = makeQuiz1Set(fixture, 'mixed', 8, () => .5);
  assert.equal(set.queue.length, 8);
  assert.equal(new Set(set.queue).size, 8);
  assert.equal(new Set(set.queue.map(id => fixture.find(q => q.id === id).kind)).size, 4);
  assert.equal(set.position, 0);
  assert.deepEqual(set.ratings, {});
});
test('type filter and small banks never borrow questions or duplicate items', () => {
  const set = makeQuiz1Set(fixture, 'map', 8, () => 0);
  assert.equal(set.queue.length, 4);
  assert.ok(set.queue.every(id => id.startsWith('map-')));
  assert.equal(makeQuiz1Set([], 'mixed').queue.length, 0);
});
test('self-check advances once and retry contains only missed questions', () => {
  let set = makeQuiz1Set(fixture, 'comparison', 2, () => .5);
  const original = set;
  set = rateQuiz1(set, 'again');
  assert.equal(original.position, 0);
  set = rateQuiz1(set, 'known');
  assert.equal(set.position, 2);
  assert.equal(rateQuiz1(set, 'again'), set);
  const retry = retryQuiz1(set);
  assert.deepEqual(retry.queue, [set.queue[0]]);
  assert.equal(retry.position, 0);
  assert.deepEqual(retry.ratings, {});
});
test('saved progress rejects corrupted, stale or inconsistent state', () => {
  const valid = rateQuiz1(makeQuiz1Set(fixture, 'mixed'), 'known');
  assert.deepEqual(parseQuiz1Review(JSON.stringify(valid), fixture), valid);
  for (const value of [null, { ...valid, version: 2 }, { ...valid, queue: ['unknown'] }, { ...valid, position: -1 }, { ...valid, ratings: {} }, { ...valid, ratings: { ...valid.ratings, [valid.queue[1]]: 'known' } }, { ...valid, queue: [valid.queue[0], valid.queue[0]] }]) assert.equal(parseQuiz1Review(JSON.stringify(value), fixture), null);
  assert.equal(parseQuiz1Review('{', fixture), null);
});
test('curated text questions are concise and comparisons retain two evidence sources', () => {
  const bounds = { d101: 78, d102: 93, d103: 129, d107: 1 };
  assert.ok(bank.length >= 12);
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
  for (const q of bank) {
    assert.ok(['short-answer', 'comparison'].includes(q.kind));
    assert.ok(q.answer.split(/\s+/).length < 70);
    assert.ok(q.evidence.trim());
    const refs = [q.source, ...(q.additionalSources || [])];
    if (q.kind === 'comparison') { assert.ok(refs.length >= 2); assert.ok(q.additionalSources.every(s => s.evidence)); }
    for (const ref of refs) {
      assert.ok(bounds[ref.docId]);
      assert.ok(Number.isInteger(ref.page) && ref.page >= 1 && ref.page <= bounds[ref.docId]);
      const doc = documents.find(d => d.id === ref.docId);
      if (doc) assert.ok(ref.page <= doc.pages);
    }
  }
});
