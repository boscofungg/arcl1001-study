// Quiz 3 mock paper (Lectures 8–11): same template as Quiz 2, its own bank, map and storage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createQuiz3Paper, parseQuiz3Library, quiz3Bank, quiz3Lectures } from '../lib/quiz3-mock-paper.ts';
import { parseMockLibrary as parseQuiz2 } from '../lib/quiz2-mock-paper.ts';
import { quiz3MapTargets, quiz3MapSets } from '../lib/quiz3-map-data.ts';
import { sentenceCount } from '../lib/mock-paper.ts';
import { compareDrawing } from '../lib/map-drawing.ts';
import docs from '../lib/documents.json' with { type: 'json' };
import visuals from '../lib/visuals.json' with { type: 'json' };

const normal = s => s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
const pageOf = (docId, page) => visuals[docId].pages.find(p => p.page === page);
function assertEvidence(id, s) {
  const doc = docs.find(d => d.id === s.docId);
  assert.ok(doc && doc.kind === 'Lecture' && [8, 9, 10, 11].includes(doc.week), `${id} ${s.docId}`);
  const page = pageOf(s.docId, s.page);
  assert.ok(page, `${id} ${s.docId}:${s.page}`);
  if (s.evidenceKind === 'visual') { assert.ok(page.images.length && s.evidence.length > 20, id); return; }
  const text = normal(page.textBlocks.map(b => b.text).join(' '));
  for (const token of s.evidence.split(/\s+/).map(normal).filter(t => t.length > 2)) assert.ok(text.includes(token), `${id} ${s.docId}:${s.page}: ${token}`);
}

test('every Quiz 3 question is backed by Lecture 8–11 slide text and real images', () => {
  const all = [...quiz3Bank.images, ...quiz3Bank.concepts, ...quiz3Bank.significance, ...quiz3Bank.discussions];
  assert.equal(new Set(all.map(q => q.id)).size, all.length);
  for (const q of all) {
    assert.ok(q.question && q.answer && q.checklist.length && q.sources.length, q.id);
    for (const s of q.sources) assertEvidence(q.id, s);
  }
  for (const q of quiz3Bank.images) {
    assert.equal(q.checklist.length, 4);
    const views = q.images || [q.image];
    assert.equal(views[0].src, q.image.src);
    for (const v of views) assert.ok(existsSync(new URL('../public' + v.src, import.meta.url)), v.src);
  }
  assert.ok(quiz3Bank.images.every(q => (q.images || []).length >= 2), 'each option shows at least two views');
  for (const q of [...quiz3Bank.concepts, ...quiz3Bank.significance]) assert.ok(sentenceCount(q.answer) <= 3, q.id);
  for (const q of quiz3Bank.discussions) assert.ok(sentenceCount(q.answer) <= 7, q.id);
  for (const field of ['images', 'concepts', 'significance', 'discussions'])
    assert.deepEqual([...new Set(quiz3Bank[field].map(q => q.sources[0].docId))].sort(), [...quiz3Lectures].sort(), field);
});

test('Quiz 3 map targets cite slides, sit on the map and accept their own guide', () => {
  const ids = new Set(quiz3MapTargets.map(t => t.id));
  for (const t of quiz3MapTargets) {
    assert.ok(t.x > 0 && t.x < 1 && t.y > 0 && t.y < 1, t.id);
    for (const s of t.sources) assertEvidence(t.id, s);
    assert.equal(compareDrawing({ x: t.x, y: t.y }, t.guide).level, 'good', t.id);
  }
  for (const set of quiz3MapSets) { assert.equal(new Set(set).size, 3); assert.ok(set.every(id => ids.has(id))); }
  assert.ok(quiz3MapTargets.every(t => quiz3MapSets.flat().includes(t.id)), 'every target is used');
});

test('every Quiz 3 paper spans all four lectures and varies between papers', () => {
  const previous = [];
  for (let i = 0; i < 12; i++) {
    const p = createQuiz3Paper(previous, () => (i * 0.37) % 1);
    assert.equal(new Set(p.images).size, 3);
    const picked = [...quiz3Bank.images.filter(q => p.images.includes(q.id)), ...['concepts', 'significance', 'discussions'].map((f, n) => quiz3Bank[f].find(q => q.id === [p.concept, p.significance, p.discussion][n]))];
    assert.deepEqual([...new Set(picked.map(q => docs.find(d => d.id === q.sources[0].docId).week))].sort((a, b) => a - b), [8, 9, 10, 11]);
    if (previous.length) assert.notEqual(p.concept, previous.at(-1).concept);
    previous.push(p);
  }
});

test('Quiz 3 papers save separately from Quiz 2 papers', () => {
  const p = createQuiz3Paper([], () => 0.4);
  const lib = { version: 1, selected: p.id, papers: [p] };
  assert.deepEqual(parseQuiz3Library(JSON.stringify(lib)), lib);
  assert.equal(parseQuiz2(JSON.stringify(lib)).papers.length, 0, 'Quiz 2 rejects Quiz 3 question IDs');
  const ui = readFileSync(new URL('../components/mock-paper.tsx', import.meta.url), 'utf8');
  assert.ok(ui.includes("useState<Quiz>(3)"), 'Quiz 3 is the default');
});
