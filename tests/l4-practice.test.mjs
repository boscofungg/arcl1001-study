import test from 'node:test';
import assert from 'node:assert/strict';
import questions from '../content/l4-practice.json' with { type: 'json' };
import rubrics from '../content/l4-rubrics.json' with { type: 'json' };

const normalize = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const matches = (rubric, answer) => rubric.criteria.filter(criterion => criterion.patterns.some(pattern => new RegExp(pattern).test(normalize(answer)))).length;

test('L4 provides ten slide-only open questions with matched rubrics', () => {
  assert.equal(questions.length, 10);
  assert.equal(new Set(questions.map(question => question.id)).size, 10);
  assert.deepEqual(questions.map(question => question.id), rubrics.map(rubric => rubric.questionId));
  for (const question of questions) {
    assert.equal(question.kind, 'short-answer');
    assert.equal(question.options, undefined);
    assert.equal(question.source.docId, 'd111');
    assert.ok(question.source.page > 0 && question.source.page <= 97);
    assert.ok(question.evidence.trim());
    const rubric = rubrics.find(item => item.questionId === question.id);
    assert.equal(matches(rubric, question.answer), rubric.criteria.length, question.id);
    assert.equal(matches(rubric, ''), 0);
  }
});

test('L4 rubrics accept useful equivalents while distinguishing crop functions', () => {
  const cases = [
    [0, 'Adjustment, reliance, and altering the environment.'],
    [1, 'Terracing and irrigation.'],
    [2, 'Corn, beans, pumpkins.'],
    [3, 'Beans fix nitrogen. Squash conserves water.'],
    [4, 'People interacting with plants; reconstructing agriculture.'],
    [5, 'Floatation separates remains in water.'],
    [6, 'Farming and drainage.'],
    [7, 'Geology helps reconstruct site formation.'],
    [8, 'Potatoes provide carbohydrates. Quinoa provides protein.'],
    [9, 'Monument building ceased; royal inscriptions were missing; cities were deserted.'],
  ];
  for (const [index, answer] of cases) assert.equal(matches(rubrics[index], answer), rubrics[index].criteria.length, answer);
  assert.ok(matches(rubrics[3], 'Beans conserve water. Squash provides nitrogen.') < 2);
  assert.ok(matches(rubrics[8], 'Potato provides protein. Quinoa provides starch.') < 2);
});
