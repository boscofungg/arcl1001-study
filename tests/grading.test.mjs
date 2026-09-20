import test from 'node:test';
import assert from 'node:assert/strict';
import { gradedQuestions, gradeAnswer } from '../lib/graded-questions.ts';
const get = id => gradedQuestions.find(question => question.id === id);

test('15 source-backed questions use balanced MCQ and single-blank formats', () => {
  assert.equal(gradedQuestions.length, 15);
  assert.equal(new Set(gradedQuestions.map(q => q.id)).size, 15);
  assert.equal(gradedQuestions.filter(q => q.format === 'blank').length, 7);
  for (const q of gradedQuestions) {
    assert.ok(q.source.docId && q.source.page && q.evidence && q.explanation);
    if (q.id.startsWith('visual')) assert.ok(q.image.src);
    if (q.format === 'mcq') {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options.map(o => o.id)).size, 4);
      assert.equal(new Set(q.options.map(o => o.text)).size, 4);
      assert.equal(q.options.filter(o => o.id === q.correctOptionId).length, 1);
    } else assert.equal((q.prompt.match(/_____/g) || []).length, 1);
  }
});

test('every MCQ choice is graded by exact valid option ID', () => {
  for (const q of gradedQuestions.filter(q => q.format === 'mcq')) {
    for (const option of q.options) assert.equal(gradeAnswer(q, option.id).correct, option.id === q.correctOptionId);
    for (const invalid of ['', ' ', 'z', 'a b', q.answer, 'A']) assert.equal(gradeAnswer(q, invalid).correct, false);
  }
});

test('every curated synonym accepts accents, punctuation, case and whitespace variations', () => {
  for (const q of gradedQuestions.filter(q => q.format === 'blank')) {
    for (const alias of q.acceptedAnswers) {
      assert.equal(gradeAnswer(q, alias).correct, true, `${q.id}: ${alias}`);
      assert.equal(gradeAnswer(q, `  ${alias.toUpperCase().replaceAll(' ', '   ')}!  `).correct, true);
      assert.equal(gradeAnswer(q, `not ${alias}`).correct, false);
      assert.equal(gradeAnswer(q, `${alias} or something else`).correct, false);
    }
  }
  assert.equal(gradeAnswer(get('q1-text-07'), 'urbánisation').correct, true);
  assert.equal(gradeAnswer(get('visual-008'), 'Priest-King').correct, true);
  assert.equal(gradeAnswer(get('q1-text-16'), 'kiln-fired clay bricks').correct, true);
});

test('conservative long-word typos work without making short opposing words equivalent', () => {
  for (const typo of ['urbanizaton', 'urbaniztaion', 'urbanizetion', 'urbanizaation']) assert.equal(gradeAnswer(get('q1-text-07'), typo).correct, true, typo);
  assert.equal(gradeAnswer(get('q1-text-01'), 'matreial remains').correct, true);
  for (const wrong of ['younger', 'newer', 'old', 'older and younger', 'not older', 'no older', 'older? younger?', 'older or earlier']) assert.equal(gradeAnswer(get('q1-text-04'), wrong).correct, false, wrong);
  for (const wrong of ['ruralization', 'ruralisation', 'urban', 'rural', 'deurbanization', 'not urbanization', 'urbanization ruralization']) assert.equal(gradeAnswer(get('q1-text-07'), wrong).correct, false, wrong);
  for (const wrong of ['Ur', 'Uruk Harappa', 'Iraq', 'Warka Vase']) assert.equal(gradeAnswer(get('visual-017'), wrong).correct, false, wrong);
});

test('blank answers reject contradicting phrases, missing detail and keyword stuffing', () => {
  const examples = [
    ['q1-text-01', 'immaterial remains'], ['q1-text-01', 'not material remains'],
    ['q1-text-09', 'objects found together'], ['q1-text-09', 'soil not dirt'],
    ['q1-text-16', 'unfired clay bricks'], ['q1-text-16', 'mud bricks'], ['q1-text-16', 'bricks'],
    ['visual-008', 'king'], ['visual-008', 'priest'], ['visual-008', 'not the priest king'],
  ];
  for (const [id, answer] of examples) assert.equal(gradeAnswer(get(id), answer).correct, false, answer);
  for (const q of gradedQuestions) {
    for (const response of ['', '  ', '???', null, undefined, 'x'.repeat(161)]) assert.equal(gradeAnswer(q, response).correct, false);
  }
});

test('feedback gives source-grounded explanation on both correct and wrong submissions', () => {
  for (const q of gradedQuestions) {
    const correct = q.format === 'mcq' ? q.correctOptionId : q.acceptedAnswers[0];
    const wrong = q.format === 'mcq' ? q.options.find(o => o.id !== q.correctOptionId).id : 'wrong';
    assert.ok(gradeAnswer(q, correct).feedback.includes(q.explanation));
    assert.ok(gradeAnswer(q, wrong).feedback.includes(q.explanation));
    assert.ok(gradeAnswer(q, wrong).feedback.includes(q.answer));
  }
});


test('neutral articles and concise answer framing preserve equivalent meanings', () => {
  const examples = [
    ['q1-text-09', 'the soil'], ['q1-text-09', 'It is the sediment.'],
    ['q1-text-04', 'it is older'], ['q1-text-04', 'they are older'],
    ['q1-text-04', "they're earlier"], ['q1-text-04', "it's older"],
    ['q1-text-01', 'archaeological remains'], ['q1-text-01', 'artefacts'],
    ['q1-text-01', 'artifacts'], ['q1-text-01', 'the archaeological evidence'],
    ['visual-017', 'Uruk (Warka)'], ['visual-017', 'the answer is Uruk'],
    ['visual-008', 'it is the Priest-King'],
  ];
  for (const [id, answer] of examples) assert.equal(gradeAnswer(get(id), answer).correct, true, answer);
  const wrong = [
    ['q1-text-04', 'they are not older'], ['q1-text-04', 'it is older and younger'],
    ['q1-text-04', 'it is not younger'], ['q1-text-09', 'the soil is not relevant'],
    ['q1-text-01', 'evidence'], ['q1-text-01', 'things'], ['q1-text-01', 'artifacts or written myths'],
    ['q1-text-01', 'the non-archaeological remains'],
  ];
  for (const [id, answer] of wrong) assert.equal(gradeAnswer(get(id), answer).correct, false, answer);
});
