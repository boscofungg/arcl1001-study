// Features from the 13/11 student feedback and the Quiz 3 timeline request (17/11).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import documents from '../lib/documents.json' with { type: 'json' };
import visuals from '../lib/visuals.json' with { type: 'json' };
import { addMistake, recordRetry, dueMistakes, openMistakes, parseMistakeBook, mistakesToCsv, mistakesToMarkdown, emptyBook } from '../lib/mistakes.ts';
import { compareDrawing, ellipse, rasterise, validMapAnswer, simplifyPath } from '../lib/map-drawing.ts';
import { quiz2MapTargets } from '../lib/quiz2-map-data.ts';
import { mapTargets } from '../lib/mock-map-data.ts';
import { setNote, mergeNotes, parseNotes, notesToMarkdown } from '../lib/slide-notes.ts';
import { timeline, methods, regions, themes } from '../lib/timeline-data.ts';
import { courseScopes, inScope } from '../lib/course-scopes.ts';
import { weeks } from '../lib/course.ts';
import { slideQuestions } from '../lib/slide-practice.ts';

const now = Date.parse('2026-11-17T00:00:00Z'), day = 86400000;
const entry = { origin: 'practice', questionId: 'q1', week: 3, kind: 'short-answer', prompt: 'Who was Fu Hao?', modelAnswer: 'A consort of King Wu Ding.', yourAnswer: 'A king', sources: [{ docId: 'd103', page: 96, title: 'Lecture 3', label: 'Slide 96' }] };

test('mistakes are due immediately and resolve after three spaced correct retries', () => {
  let book = addMistake(emptyBook, entry, now);
  assert.equal(dueMistakes(book, now).length, 1);
  book = recordRetry(book, 'practice:q1', true, 'consort', now);
  assert.equal(dueMistakes(book, now).length, 0);
  assert.equal(dueMistakes(book, now + day).length, 1);
  book = recordRetry(book, 'practice:q1', false, 'king', now + day);
  assert.equal(book.items[0].box, 0);
  for (const offset of [1, 2, 5]) book = recordRetry(book, 'practice:q1', true, 'consort', now + offset * day);
  assert.equal(openMistakes(book).length, 0);
  book = addMistake(book, entry, now + 30 * day);
  assert.equal(openMistakes(book).length, 1, 'a new wrong answer reopens a mastered mistake');
  assert.equal(book.items.length, 1);
});

test('mistake book export and parsing are safe', () => {
  const book = addMistake(emptyBook, { ...entry, prompt: 'Quote "this", please\nnow' }, now);
  const csv = mistakesToCsv(book);
  assert.ok(csv.split('\n').length === 2 && csv.includes('""this""'));
  assert.ok(mistakesToMarkdown(book).includes('Model answer'));
  assert.deepEqual(parseMistakeBook('nonsense'), emptyBook);
  assert.equal(parseMistakeBook(JSON.stringify(book)).items.length, 1);
  assert.equal(parseMistakeBook(JSON.stringify({ version: 1, items: [{ id: 'x' }] })).items.length, 0);
});

test('practice answers that are wrong or revealed are sent to the mistake book', () => {
  const practice = readFileSync(new URL('../components/quiz1-practice.tsx', import.meta.url), 'utf8');
  assert.ok(practice.includes("result.status!=='correct'") && practice.includes('addMistake('));
  const paper = readFileSync(new URL('../components/mock-paper.tsx', import.meta.url), 'utf8');
  assert.ok(paper.includes('chronologyMistakes(') && paper.includes('Re-answer my mistakes'));
});

test('pixel-mapped drawings: a line along the guide scores well, a distant one does not', () => {
  const river = mapTargets.find(target => target.id === 'yellow-river').guide;
  assert.equal(compareDrawing({ x: 0.77, y: 0.43, shape: 'line', path: river.points }, river).level, 'good');
  assert.equal(compareDrawing({ x: 0.2, y: 0.3, shape: 'line', path: [{ x: 0.1, y: 0.2 }, { x: 0.2, y: 0.3 }, { x: 0.3, y: 0.35 }] }, river).level, 'off');
  const maya = quiz2MapTargets.find(target => target.id === 'q2-maya');
  assert.equal(compareDrawing({ x: maya.x, y: maya.y, shape: 'area', path: ellipse(maya.x, maya.y, 0.022, 0.045) }, maya.guide).level, 'good');
  assert.equal(compareDrawing({ x: maya.x, y: maya.y }, maya.guide).level, 'good', 'a point inside the region counts');
  assert.ok(rasterise('area', ellipse(0.5, 0.5, 0.05, 0.1)).size > 10);
});

test('every map target has a guide inside the map, and stored drawings are validated', () => {
  for (const target of [...mapTargets, ...quiz2MapTargets]) {
    assert.ok(target.guide, target.id);
    assert.ok(target.guide.points.every(p => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1), target.id);
  }
  assert.ok(validMapAnswer({ x: 0.2, y: 0.3, shape: 'line', path: [{ x: 0.1, y: 0.1 }] }));
  assert.ok(!validMapAnswer({ x: 2, y: 0.3 }));
  assert.ok(!validMapAnswer({ x: 0.2, y: 0.3, shape: 'blob' }));
  assert.ok(simplifyPath(Array.from({ length: 2000 }, (_, i) => ({ x: i / 2000, y: 0.5 }))).length <= 400);
});

test('slide notes save, clear, merge by newest and export grouped by document', () => {
  let notes = setNote({}, 'd128', 13, 'Columbus 1492', new Date(now));
  notes = setNote(notes, 'd103', 96, 'Fu Hao', new Date(now));
  assert.equal(Object.keys(setNote(notes, 'd103', 96, '   ')).length, 1);
  const merged = mergeNotes(notes, { 'd128:13': { text: 'older', updatedAt: new Date(now - day).toISOString() }, 'd128:14': { text: 'new', updatedAt: new Date(now).toISOString() } });
  assert.equal(merged['d128:13'].text, 'Columbus 1492');
  assert.equal(merged['d128:14'].text, 'new');
  assert.deepEqual(parseNotes('{"bad key":{"text":"x","updatedAt":"2026-01-01"}}'), {});
  const md = notesToMarkdown(notes, { d128: { title: 'Lecture 10', kind: 'Lecture' }, d103: { title: 'Lecture 3', kind: 'Lecture' } });
  assert.ok(md.indexOf('Lecture 3') < md.indexOf('Lecture 10') && md.includes('### Slide 96'));
});

const slideText = (docId, page) => visuals[docId].pages.find(p => p.page === page)?.textBlocks.map(b => b.text).join(' ').replace(/\s+/g, ' ') ?? '';

test('timeline entries cite real lecture slides whose text contains the stated years', () => {
  const ids = new Set();
  for (const event of timeline) {
    assert.ok(!ids.has(event.id), event.id); ids.add(event.id);
    const doc = documents.find(d => d.id === event.source.docId);
    assert.ok(doc && doc.kind === 'Lecture' && doc.week === event.week, event.id);
    assert.ok(regions.includes(event.region) && event.themes.every(theme => theme in themes), event.id);
    const text = slideText(event.source.docId, event.source.page);
    const year = String(Math.abs(event.start));
    assert.ok(text.includes(year) || /century/.test(event.date), `${event.id}: ${year} not on ${event.source.docId} slide ${event.source.page}`);
    if (event.end !== undefined) assert.ok(event.end >= event.start, event.id);
  }
  assert.ok(timeline.some(event => event.week === 10) && timeline.some(event => event.week === 8) && timeline.some(event => event.week === 9));
  for (const method of methods) assert.ok(slideText(method.source.docId, method.source.page).length > 0, method.id);
});

test('Lectures 10–11 are in the course, Quiz 3 covers L8–11, and new materials have page images', () => {
  assert.deepEqual(weeks.map(w => w.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual([...courseScopes.quiz3.weeks], [8, 9, 10, 11]);
  assert.ok(inScope('quiz3', 10) && !inScope('quiz3', 7) && inScope('all', 1));
  for (const id of ['d128', 'd129', 'd130']) {
    const doc = documents.find(d => d.id === id);
    assert.ok(doc, id);
    assert.equal(visuals[id].pages.length, doc.pages);
    for (const page of visuals[id].pages) assert.ok(existsSync(new URL(`../public${page.images[0].src}`, import.meta.url)), page.images[0].src);
  }
  const route = readFileSync(new URL('../app/api/chat/route.ts', import.meta.url), 'utf8');
  assert.ok(route.includes('isQuizScope(courseScope)'));
});

test('image practice questions carry a difficulty the student can choose', () => {
  const images = slideQuestions.filter(q => q.kind === 'image');
  assert.ok(images.length >= 10);
  for (const q of images) assert.ok(['easier', 'standard', 'harder'].includes(q.difficulty), q.id);
  for (const level of ['easier', 'standard', 'harder']) assert.ok(images.some(q => q.difficulty === level), level);
});
