import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import documents from '../lib/documents.json' with { type: 'json' };
import visuals from '../lib/visuals.json' with { type: 'json' };
import { slideQuestions, getSlidePracticePool } from '../lib/slide-practice.ts';
import { makeQuiz1Set, parseQuiz1Review } from '../lib/quiz1-practice.ts';

const normalized = text => text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');

test('practice contains only open questions with lecture-slide evidence for every reference', () => {
  assert.equal(slideQuestions.length, 45);
  assert.equal(new Set(slideQuestions.map(q => q.id)).size, 45);
  assert.ok(!slideQuestions.some(q => q.id === 'q1-text-18'));
  assert.deepEqual(new Set(slideQuestions.map(q => q.kind)), new Set(['short-answer', 'comparison', 'image', 'map']));
  for (const question of slideQuestions) {
    assert.ok(question.question && question.answer);
    assert.equal(question.options, undefined);
    for (const source of [question.source, ...(question.additionalSources ?? [])]) {
      assert.equal(documents.find(doc => doc.id === source.docId)?.kind, 'Lecture');
      const page = visuals[source.docId].pages.find(page => page.page === source.page);
      assert.ok(page, `${question.id}: valid slide`);
      const evidence = source === question.source ? question.evidence : source.evidence;
      assert.ok(evidence?.trim(), `${question.id}: evidence for ${source.docId}:${source.page}`);
      const pageText = normalized(page.textBlocks.map(block => block.text).join(' '));
      // Source extraction changes block order and splits words across lines. Check each
      // substantive evidence token against the normalized original slide text.
      for (const token of evidence.split(/\s+/).map(normalized).filter(token => token.length > 2)) {
        assert.ok(pageText.includes(token), `${question.id} ${source.docId}:${source.page}: ${token}`);
      }
    }
    if (question.image) assert.ok(existsSync(new URL(`../public${question.image.src}`, import.meta.url)));
  }
});

test('lecture and format filters do not borrow readings or other lectures', () => {
  for (const lecture of [1, 2, 3, 4]) {
    const pool = getSlidePracticePool(lecture);
    assert.ok(pool.length);
    for (const question of pool) for (const source of [question.source, ...(question.additionalSources ?? [])]) {
      assert.equal(documents.find(doc => doc.id === source.docId)?.week, lecture);
    }
    for (const kind of ['image', 'map', 'short-answer', 'comparison']) {
      assert.ok(getSlidePracticePool(lecture, kind).every(q => q.kind === kind && pool.includes(q)));
    }
  }
  assert.equal(getSlidePracticePool().length, 45);
});

test('slide sets support self-assessment and reject saved reading-based questions', () => {
  const review = makeQuiz1Set(slideQuestions, 'mixed', 10, () => .4);
  assert.equal(review.queue.length, 10);
  assert.equal(new Set(review.queue.map(id => slideQuestions.find(q => q.id === id).kind)).size, 4);
  assert.deepEqual(parseQuiz1Review(JSON.stringify(review), slideQuestions), review);
  assert.equal(parseQuiz1Review(JSON.stringify({ ...review, queue: ['q1-text-18'] }), slideQuestions), null);
});
