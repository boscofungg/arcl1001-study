import test from 'node:test';
import assert from 'node:assert/strict';
import rubrics from '../content/slide-short-rubrics.json' with { type: 'json' };
import { slideQuestions } from '../lib/slide-practice.ts';
const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const matches = (criterion, text) => criterion.patterns.some(pattern => new RegExp(pattern).test(normalize(text))) && !(criterion.excludePatterns ?? []).some(pattern => new RegExp(pattern).test(normalize(text)));
const score = (id, text) => rubrics.find(r => r.questionId === id).criteria.filter(c => matches(c,text)).length;
test('short rubrics cover exactly the slide-backed text questions and have valid criteria', () => {
  assert.deepEqual(rubrics.map(r=>r.questionId).sort(),slideQuestions.filter(q=>q.id.startsWith('q1-text')).map(q=>q.id).sort());
  assert.equal(new Set(rubrics.map(r=>r.questionId)).size,rubrics.length);
  for (const rubric of rubrics) {
    assert.equal(new Set(rubric.criteria.map(c=>c.id)).size,rubric.criteria.length);
    assert.ok(rubric.criteria.length);
    assert.ok((rubric.requiredCount ?? rubric.criteria.length) <= rubric.criteria.length);
    for (const c of rubric.criteria) {
      assert.ok(c.label && c.patterns.length);
      for (const p of [...c.patterns,...(c.excludePatterns??[])]) assert.doesNotThrow(()=>new RegExp(p));
    }
    const question=slideQuestions.find(q=>q.id===rubric.questionId);
    assert.ok([question.source,...(question.additionalSources??[])].every(s=>['d101','d102','d103'].includes(s.docId)));
  }
});
test('every model answer meets its short-answer rubric', () => {
  for(const rubric of rubrics) {
    const answer=slideQuestions.find(q=>q.id===rubric.questionId).answer;
    assert.ok(score(rubric.questionId,answer)>=(rubric.requiredCount??rubric.criteria.length),`${rubric.questionId}: unmatched ${rubric.criteria.filter(c=>!matches(c,answer)).map(c=>c.id)}`);
  }
});
test('equivalent terms and alternate valid city attributes are accepted', () => {
  assert.equal(score('q1-text-01','Systematic investigation of physical evidence.'),1);
  assert.equal(score('q1-text-02','Discovering, digging, examining, conserving and publishing.'),5);
  assert.equal(score('q1-text-12','Grave offerings and the size of tombs.'),2);
  assert.equal(score('q1-text-08','City walls, temples, imports and craft production.'),4);
  assert.equal(score('q1-text-14','Social inequality could be hidden.'),1);
});
test('comparison criteria bind features to their named archaeological context', () => {
  assert.equal(score('q1-text-16','Harappa had semi subterranean and above ground houses. Erlitou had baked clay bricks, courtyards and flat roofs.'),0);
  assert.equal(score('q1-text-17','Harappa had many bronzes and weapons. Fu Hao had personal ornaments and pottery.'),0);
  assert.equal(score('q1-text-15','Knapping examines the sequence of breakage and later disturbance. Refitting produces flakes.'),0);
});
