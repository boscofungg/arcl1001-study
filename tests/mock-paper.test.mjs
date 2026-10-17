import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
import {createMockPaper,parseMockLibrary,chronologyAnswer,chronologyFeedback,sentenceCount,mockBank} from '../lib/mock-paper.ts';
import docs from '../lib/documents.json' with {type:'json'};import visuals from '../lib/visuals.json' with {type:'json'};
test('paper follows six-part structure, varies prompts and does not repeat image panel immediately',()=>{
 const a=createMockPaper([],()=>.3),b=createMockPaper([a],()=>.3);assert.equal(a.images.length,3);assert.equal(new Set(a.images).size,3);assert.ok(b.images.every(id=>!a.images.includes(id)));for(const k of ['concept','significance','discussion'])assert.notEqual(a[k],b[k]);assert.equal(a.map.length,3);assert.equal(a.dates.length,2);assert.equal(a.selected.length,0);assert.equal(a.submitted,false);
});
test('saved paper roundtrip retains selection, drafts, exact dates and map positions; rejects corrupt data',()=>{
 const p=createMockPaper();p.selected=p.images.slice(0,2);p.answers[p.concept]='A written answer.';p.points[p.map[0]]={x:.3,y:.5};const lib={version:1,selected:p.id,papers:[p]};assert.deepEqual(parseMockLibrary(JSON.stringify(lib)),lib);
 for(const patch of [{selected:p.images},{images:['bad','bad','bad']},{points:{bad:{x:2,y:1}}},{answers:{bad:2}},{dates:[]}])assert.equal(parseMockLibrary(JSON.stringify({...lib,papers:[{...p,...patch}]})).papers.length,0);
});
test('chronology orders BCE and CE and explains year-zero ambiguity without accepting random guesses',()=>{
 const bce={a:{year:100,era:'BCE'},b:{year:1000,era:'BCE'}};assert.deepEqual(chronologyAnswer(bce),{recent:'a',years:900,simpleYears:900});
 const cross={a:{year:350,era:'CE'},b:{year:75,era:'BCE'}};assert.equal(chronologyAnswer(cross).years,424);assert.ok(chronologyFeedback(cross,'a','425').gapCorrect);assert.ok(chronologyFeedback(cross,'a','424').gapCorrect);assert.equal(chronologyFeedback(cross,'b','400').recentCorrect,false);assert.equal(chronologyFeedback(cross,'a','400').gapCorrect,false);
});
test('every mock answer cites existing L1–3 slides and all image fields have checklists',()=>{
 const normal=s=>s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
 for(const item of Object.values(mockBank).flat()){
  assert.ok(item.answer&&item.checklist.length&&item.sources.length);
  for(const source of item.sources){const doc=docs.find(d=>d.id===source.docId);assert.equal(doc.kind,'Lecture');assert.ok(doc.week<=3);const page=visuals[source.docId].pages.find(p=>p.page===source.page);assert.ok(page);const text=normal(page.textBlocks.map(b=>b.text).join(' '));for(const token of source.evidence.split(/\s+/).map(normal).filter(t=>t.length>2))assert.ok(text.includes(token),`${item.id}:${source.page}:${token}`);}
 }
 for(const q of mockBank.images){assert.equal(q.checklist.length,4);assert.ok(existsSync(new URL('../public'+q.image.src,import.meta.url)));}
 for(const q of [...mockBank.concepts,...mockBank.significance])assert.ok(sentenceCount(q.answer)<=3,q.id);
 for(const q of mockBank.discussions)assert.ok(sentenceCount(q.answer)<=7,q.id);
});
