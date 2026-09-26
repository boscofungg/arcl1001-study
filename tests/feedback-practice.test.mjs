import test from 'node:test';
import assert from 'node:assert/strict';
import questions from '../content/feedback-practice.json' with { type: 'json' };
import rubrics from '../content/feedback-rubrics.json' with { type: 'json' };
import visuals from '../lib/visuals.json' with { type: 'json' };
import original from '../content/quiz1-question-bank.json' with { type: 'json' };
import { markSlideAnswer } from '../lib/slide-marking.ts';

test('feedback questions expand L1–3 with exact evidence from slides only', () => {
  assert.equal(questions.length, 8);
  assert.equal(new Set(questions.map(q => q.id)).size, 8);
  assert.deepEqual(['d101', 'd102', 'd103'].map(id => questions.filter(q => q.source.docId === id).length), [3, 3, 2]);
  for (const q of questions) {
    assert.ok(['short-answer', 'comparison'].includes(q.kind));
    assert.ok(!original.some(old => old.id === q.id || old.question === q.question));
    for (const source of [{ ...q.source, evidence: q.evidence }, ...(q.additionalSources ?? [])]) {
      assert.ok(['d101', 'd102', 'd103'].includes(source.docId));
      const page = visuals[source.docId].pages.find(p => p.page === source.page);
      assert.equal(source.evidence, page.textBlocks.map(block => block.text).join('\n'), q.id);
    }
    assert.equal(rubrics.filter(r => r.questionId === q.id).length, 1);
  }
});

test('new model answers and ordinary equivalent wording receive full credit', () => {
  for (const q of questions) assert.equal(markSlideAnswer(q.id, q.answer)?.status, 'correct', q.id);
  const equivalents = [
    ['01', 'Maya civilization; Guatemala'],
    ['02', 'Hands are free, and less energy is needed.'],
    ['02', 'Temperature control and energy efficiency'],
    ['03', 'Skull of a human, jaw of an orangutan'],
    ['04', 'Ubaid was mainly agricultural villages. Uruk was an autonomous city.'],
    ['05', 'Babies underneath homes'],
    ['06', 'A clay envelope with tokens inside'],
    ['07', 'They are plentiful and durable'],
    ['07', 'Typology helps relative chronology and shows economic decisions'],
    ['08', 'She owned land and commanded troops'],
    ['08', 'Wu Ding’s wife and a ritual leader'],
  ];
  for (const [suffix, answer] of equivalents) assert.equal(markSlideAnswer(`feedback-text-${suffix}`, answer)?.status, 'correct', answer);
});

test('missing points, negated answers and swapped evidence do not earn full credit', () => {
  assert.equal(markSlideAnswer('feedback-text-01', 'Guatemala')?.status, 'partial');
  assert.equal(markSlideAnswer('feedback-text-02', 'Free hands')?.score, 1);
  assert.equal(markSlideAnswer('feedback-text-05', 'Infants')?.status, 'partial');
  assert.equal(markSlideAnswer('feedback-text-07', 'Abundant')?.score, 1);
  for (const [suffix, answer] of [
    ['01', 'Not Maya. Not Guatemala.'],
    ['03', 'Orangutan cranium and a human jaw'],
    ['04', 'Tel-Abada was an independent city-state. Uruk was a farming village.'],
    ['05', 'Adults under houses'],
    ['06', 'A clay ball without tokens'],
    ['07', 'Not abundant and not durable'],
    ['08', 'She was not a general and never owned land'],
  ]) assert.notEqual(markSlideAnswer(`feedback-text-${suffix}`, answer)?.status, 'correct', answer);
});
