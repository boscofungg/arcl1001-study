import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import corpus from '../lib/corpus.json' with {type:'json'};
import documents from '../lib/documents.json' with {type:'json'};
import {gradedQuestions,gradeAnswer} from '../lib/graded-questions.ts';
const norm=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim();
test('every new question has a resolvable page and an exact source quotation',()=>{
 const extras=gradedQuestions.filter(q=>q.id.startsWith('extra-'));assert.equal(extras.length,30);
 for(const q of extras){
  const doc=documents.find(d=>d.id===q.source.docId);assert.ok(doc);assert.ok(q.source.page>=doc.startPage&&q.source.page<=doc.pages);
  const text=corpus.filter(c=>c.docId===doc.id&&c.page===q.source.page).map(c=>c.text).join('\n');
  assert.ok(norm(text).includes(norm(q.evidence)),q.id);
  if(q.image)assert.ok(existsSync('public'+q.image.src));
  if(doc.kind==='Web')assert.ok(doc.url);else assert.ok(existsSync(`public/materials/${doc.id}/page-${q.source.page}.webp`));
  assert.equal(gradeAnswer(q,q.format==='mcq'?q.correctOptionId:q.acceptedAnswers[0]).correct,true,q.id);
 }
});
test('new topics do not collapse distinct archaeological terms into the same answer',()=>{
 const q=gradedQuestions.find(q=>q.id==='extra-l2-08');
 for(const wrong of ['provenance','place of manufacture','association','matrix'])assert.equal(gradeAnswer(q,wrong).correct,false);
});

test('typo tolerance does not accept known different concepts',()=>{
 for(const [id,wrong] of [['extra-l3-08','nitrification'],['extra-l1-06','feathers'],['extra-l1-08','conservatory']])assert.equal(gradeAnswer(gradedQuestions.find(q=>q.id===id),wrong).correct,false);
 assert.equal(gradeAnswer(gradedQuestions.find(q=>q.id==='extra-l3-08'),'vitrificaton').correct,true);
});
