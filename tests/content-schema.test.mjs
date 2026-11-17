// Validates every hand-authored practice question so a malformed entry fails CI instead of silently disappearing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import documents from '../lib/documents.json' with { type: 'json' };
import { slideQuestions, practiceLectures, latestPracticeLecture } from '../lib/slide-practice.ts';

const files = ['quiz1-question-bank', 'quiz1-visual-questions', 'l4-practice', 'feedback-practice', 'practice-variety', 'l5-practice'];
const raw = (await Promise.all(files.map(name => import(`../content/${name}.json`, { with: { type: 'json' } })))).flatMap(module => module.default);
// Retired on purpose: cites a reading (d107) that is no longer in the course library.
const knownRetired = new Set(['q1-text-18']);
const lectures = new Map(documents.filter(doc => doc.kind === 'Lecture').map(doc => [doc.id, doc]));

test('question ids are unique and required fields are present', () => {
  const ids = raw.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate question id');
  for (const q of raw) {
    for (const field of ['id', 'question', 'answer', 'evidence']) assert.ok(typeof q[field] === 'string' && q[field].trim(), `${q.id}: ${field}`);
    assert.ok(['image', 'map', 'short-answer', 'comparison'].includes(q.kind), `${q.id}: kind ${q.kind}`);
    assert.ok(q.source && typeof q.source.docId === 'string' && Number.isInteger(q.source.page), `${q.id}: source`);
    if (q.image) assert.ok(existsSync(new URL(`../public${q.image.src}`, import.meta.url)), `${q.id}: missing image ${q.image.src}`);
  }
});

test('only explicitly retired questions are dropped from the active bank', () => {
  const active = new Set(slideQuestions.map(q => q.id));
  const dropped = raw.filter(q => !active.has(q.id)).map(q => q.id);
  assert.deepEqual(dropped.sort(), [...knownRetired].sort());
  for (const q of slideQuestions) for (const source of [q.source, ...(q.additionalSources ?? [])]) {
    const doc = lectures.get(source.docId);
    assert.ok(doc && source.page >= 1 && source.page <= doc.pages, `${q.id}: ${source.docId} p${source.page}`);
  }
});

test('practice opens on a lecture that has questions', () => {
  assert.ok(practiceLectures().length > 0);
  assert.ok(practiceLectures().includes(latestPracticeLecture()));
  assert.ok([4, 5, 6, 7].includes(latestPracticeLecture([4, 5, 6, 7])));
});
