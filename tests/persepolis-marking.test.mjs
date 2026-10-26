import test from 'node:test';import assert from 'node:assert/strict';
import {markSlideAnswer} from '../lib/slide-marking.ts';
const mark=answer=>markSlideAnswer('l5-text-03',answer);
test('reversed Persepolis roles never earn credit from neighbouring names',()=>{
 for(const answer of ['Darius destroyed persepolis, alexander built it?','Alexander established Persepolis; Darius destroyed it.','Persepolis was founded by Alexander and destroyed by Darius.','Built by Alexander. Burnt by Darius.'])assert.equal(mark(answer).score,0,answer);
});
test('correct active and passive wording retains full credit',()=>{
 for(const answer of ['Darius the Great established Persepolis; Alexander the Great destroyed it in 330 BCE.','Darius built it and Alexander burned it.','Founded by Darius; destroyed by Alexander.','Persepolis was established by Darius the Great and was sacked by Alexander the Great.','Alexander destroyed it. Darius founded it.'])assert.equal(mark(answer).status,'correct',answer);
});
test('negation, contradictions and missing parts are not marked fully correct',()=>{
 assert.equal(mark('Darius established Persepolis.').score,1);
 assert.equal(mark('Alexander destroyed it.').score,1);
 for(const a of ['Darius and Alexander','Darius never established it; Alexander did not destroy it.','Darius built it. Darius destroyed it. Alexander destroyed it.'])assert.notEqual(mark(a).status,'correct',a);
});
test('previously saved reversed answers are re-evaluated on reload',async()=>{
 const {parseMarkedSet}=await import('../lib/marked-slide-review.ts');const {slideQuestions}=await import('../lib/slide-practice.ts');const id='l5-text-03';
 const old={version:2,review:{version:1,queue:[id],position:1,ratings:{[id]:'known'},startedAt:'2026-10-26'},answers:{[id]:{text:'Darius destroyed persepolis, alexander built it?',mode:'marked'}}};
 assert.equal(parseMarkedSet(JSON.stringify(old),slideQuestions).review.ratings[id],'again');
});
