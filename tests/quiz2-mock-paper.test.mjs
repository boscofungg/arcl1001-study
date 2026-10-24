import test from 'node:test';import assert from 'node:assert/strict';import {existsSync,readFileSync} from 'node:fs';
import {createMockPaper,parseMockLibrary,mockBank,sentenceCount} from '../lib/quiz2-mock-paper.ts';
import {createMockPaper as createQuiz1,parseMockLibrary as parseQuiz1} from '../lib/mock-paper.ts';
import docs from '../lib/documents.json' with {type:'json'};import visuals from '../lib/visuals.json' with {type:'json'};
const normal=s=>s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
test('Quiz 2 papers draw only new bank IDs and preserve their saved state',()=>{
 const p=createMockPaper([],()=>.4);assert.equal(p.images.length,3);assert.equal(new Set(p.images).size,3);assert.equal(p.map.length,3);
 const lib={version:1,selected:p.id,papers:[p]};assert.deepEqual(parseMockLibrary(JSON.stringify(lib)),lib);
 const q1=createQuiz1();const old={version:1,selected:q1.id,papers:[q1]};assert.equal(parseMockLibrary(JSON.stringify(old)).papers.length,0);assert.deepEqual(parseQuiz1(JSON.stringify(old)),old);
 assert.equal(parseQuiz1(JSON.stringify(lib)).papers.length,0);
});
test('new papers vary content and map sets without mutating earlier attempts',()=>{
 const first=createMockPaper([],()=>.3);const original=JSON.stringify(first);const next=createMockPaper([first],()=>.3);
 assert.notEqual(first.concept,next.concept);assert.notEqual(first.discussion,next.discussion);assert.notDeepEqual(first.map,next.map);assert.equal(JSON.stringify(first),original);
});
test('all Quiz 2 mock content is backed by Lecture 4–7 slides with valid images',()=>{
 const covered=new Set();
 for(const q of Object.values(mockBank).flat()){
  assert.ok(q.question&&q.answer&&q.checklist.length&&q.sources.length);
  for(const s of q.sources){const doc=docs.find(d=>d.id===s.docId);assert.equal(doc.kind,'Lecture');assert.ok([4,5,6,7].includes(doc.week));covered.add(doc.week);const page=visuals[s.docId].pages.find(p=>p.page===s.page);assert.ok(page);if(s.evidenceKind==='visual'){assert.ok(['d111:53','d111:70','d114:31','d114:48','d123:63'].includes(`${s.docId}:${s.page}`));assert.ok(page.images.length&&s.evidence.length>20);continue;}const text=normal(page.textBlocks.map(b=>b.text).join(' '));for(const token of s.evidence.split(/\s+/).map(normal).filter(t=>t.length>2))assert.ok(text.includes(token),`${q.id} ${s.docId}:${s.page}: ${token}`);}
 }
 assert.deepEqual([...covered].sort(),[4,5,6,7]);
 for(const q of mockBank.images){assert.equal(q.checklist.length,4);assert.ok(existsSync(new URL('../public'+q.image.src,import.meta.url)));}
 for(const q of [...mockBank.concepts,...mockBank.significance])assert.ok(sentenceCount(q.answer)<=3,q.id);
 for(const q of mockBank.discussions)assert.ok(sentenceCount(q.answer)<=7,q.id);
});
test('Quiz 1 is suspended in the interface but its storage namespace is not overwritten',()=>{
 const ui=readFileSync(new URL('../components/mock-paper.tsx',import.meta.url),'utf8');const main=readFileSync(new URL('../app/(study)/study-client.tsx',import.meta.url),'utf8');
 assert.ok(ui.includes("key='stratum-quiz2-mock-paper-v1'"));assert.ok(!ui.includes("key='stratum-mock-paper-v1'"));assert.ok(!main.includes('Mock paper · Quiz 1 format'));assert.ok(main.includes('Mock paper · Quiz 2'));
});
test('every paper spans all four Quiz 2 lectures',()=>{
 const previous=[];
 for(let i=0;i<12;i++){
  const p=createMockPaper(previous,()=>.4);previous.push(p);
  const selected=[...mockBank.images.filter(q=>p.images.includes(q.id)),mockBank.concepts.find(q=>q.id===p.concept),mockBank.significance.find(q=>q.id===p.significance),mockBank.discussions.find(q=>q.id===p.discussion)];
  assert.deepEqual([...new Set(selected.flatMap(q=>q.sources.map(s=>docs.find(d=>d.id===s.docId).week)))].sort(),[4,5,6,7]);
 }
});
