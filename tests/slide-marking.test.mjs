import test from 'node:test';import assert from 'node:assert/strict';
import {slideQuestions} from '../lib/slide-practice.ts';
import {markSlideAnswer,slideRubrics} from '../lib/slide-marking.ts';
import {startMarkedSet,recordSlideResponse,advanceMarkedSet,retryMarkedSet,parseMarkedSet,markedSetTotals} from '../lib/marked-slide-review.ts';
test('all slide questions have rubrics and their exact model answers receive full credit',()=>{
 assert.equal(slideRubrics.length,45);assert.equal(new Set(slideRubrics.map(r=>r.questionId)).size,45);
 for(const q of slideQuestions){const m=markSlideAnswer(q.id,q.answer);assert.equal(m.status,'correct',q.id);assert.equal(m.modelAnswer,q.answer);}
});
test('equivalent wording and multiple correct city attributes are accepted',()=>{
 for(const [id,answer] of [['q1-text-01','We examine artefacts to understand how people lived.'],['q1-text-02','Discovering, digging, examining, conserving and publishing.'],['q1-text-08','City walls, temples, imports and craft production.'],['q1-text-12','Grave offerings and the size of tombs.'],['visual-013','Mohenjo Daro, Sindh'],['visual-014','Harappa in Pakistan']])assert.equal(markSlideAnswer(id,answer).status,'correct',answer);
});
test('partial credit identifies missing identity, place or numerical parts',()=>{
 const age=markSlideAnswer('visual-002','Engis 2 from Belgium, 42,000 years old');assert.equal(age.status,'correct');
 const wrong=markSlideAnswer('visual-004','Warka Vase from Uruk, 3000 AD');assert.equal(wrong.status,'partial');assert.equal(wrong.score,2);assert.equal(wrong.maxScore,3);assert.equal(wrong.criteria.find(c=>c.id==='date').matched,false);
 assert.equal(markSlideAnswer('visual-004','Warka Vase from Uruk, 3050 BCE').status,'correct');
 assert.equal(markSlideAnswer('visual-003','Gobekli Tepe, Turkey, 9800–8100 BC').status,'correct');
 assert.equal(markSlideAnswer('visual-003','Gobekli Tepe, Turkey, 10000–1000 BC').status,'partial');
 assert.equal(markSlideAnswer('visual-010','Owl zun, Fu Hao tomb, late Shang').status,'correct');
 assert.equal(markSlideAnswer('visual-010','Owl zun, Fu Hao tomb, late Shang 1200 AD').status,'partial');
});
test('negated claims and swapped comparison facts do not receive full marks',()=>{
 for(const [id,answer] of [['q1-text-01','Not material remains'],['q1-text-04','Deeper layers are not older'],['q1-text-04','Lower layers are younger and upper layers are older'],['q1-text-07','A society never becomes urban'],['q1-text-11','This modern name proves he was a king'],['q1-text-11','It is not uncertain'],['q1-text-16','Harappa had semi subterranean houses. Erlitou had baked brick houses.']])assert.notEqual(markSlideAnswer(id,answer).status,'correct',answer);
 assert.equal(markSlideAnswer('unknown','answer'),null);
});
test('answers persist without trusting editable scores, cannot be marked twice, and reveal-only earns no marks',()=>{
 const q=slideQuestions.find(q=>q.id==='visual-004');let state=startMarkedSet([q],'mixed',5);
 state=recordSlideResponse(state,'Warka Vase from Uruk, 3000 BCE','marked');assert.equal(markedSetTotals(state).score,3);
 assert.equal(recordSlideResponse(state,'wrong','marked'),state);assert.deepEqual(parseMarkedSet(JSON.stringify(state),[q]),state);
 const done=advanceMarkedSet(state);assert.equal(done.review.position,1);assert.equal(done.review.ratings[q.id],'known');
 let reveal=startMarkedSet([q],'mixed',5);reveal=recordSlideResponse(reveal,'','revealed');assert.deepEqual(markedSetTotals(reveal),{attempted:0,revealed:1,score:0,maxScore:0});reveal=advanceMarkedSet(reveal);assert.equal(reveal.review.ratings[q.id],'again');assert.equal(retryMarkedSet(reveal).review.position,0);
 const corrupted=JSON.parse(JSON.stringify(done));corrupted.answers[q.id].text='wrong';assert.equal(parseMarkedSet(JSON.stringify(corrupted),[q]).review.ratings[q.id],'again');
 assert.equal(parseMarkedSet(JSON.stringify({version:2,review:done.review,answers:{}}),[q]),null);
});

test('context definitions cannot be swapped and still earn full credit',()=>{
 const mark=markSlideAnswer('q1-text-09','Provenience is soil. Matrix is find location. Association means objects together.');
 assert.equal(mark.score,1);assert.equal(mark.maxScore,3);
 assert.equal(markSlideAnswer('q1-text-09','Provenance is the find location; matrix is soil; assemblage means objects together.').status,'correct');
});
