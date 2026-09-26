import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieve, getSource, getDocumentPages } from '../lib/retrieval.ts';
import documents from '../lib/documents.json' with {type:'json'};
test('Uruk retrieves evidence and every citation resolves to the original page',()=>{
 const results=retrieve('What makes Uruk a city?',2);
 assert.ok(results.length>0);assert.ok(results.every(s=>s.week===2));
 assert.ok(results.some(s=>/uruk/i.test(s.text)));
 for(const s of results){assert.equal(getSource(s.id).text,s.text);assert.ok(s.page>=1);assert.ok(s.page<=documents.find(d=>d.id===s.docId).pages);}
});
test('missing weeks and unrelated queries do not manufacture results',()=>{
 assert.deepEqual(retrieve('Uruk',12),[]);assert.deepEqual(retrieve('qwertyzzxyz'),[]);assert.deepEqual(retrieve('what is the'),[]);
});
test('source selection and page diversity are enforced',()=>{
 const doc=documents.find(d=>d.kind==='Lecture'&&d.week===3);
 const results=retrieve('Mohenjo-daro Erlitou social hierarchy',3,doc.id);
 assert.ok(results.length);assert.ok(results.every(s=>s.docId===doc.id));
 assert.equal(new Set(results.map(s=>s.page)).size,results.length);
 assert.ok(getDocumentPages(doc.id).length>50);
 assert.equal(getSource('made-up'),null);
});
test('practice intent retrieves substantive urbanization lecture slides',()=>{
 const results=retrieve('Ask me a practice question about urbanization.');
 assert.ok(results.some(s=>s.kind==='Lecture'&&s.week===2&&/urban|cities/i.test(s.text)));
 assert.equal(results[0].week,2);
 assert.ok(!results.some(s=>/quiz.*cover/i.test(s.text)));
});

test('Quiz1 comparisons retrieve evidence from both named regions',()=>{
 const results=retrieve('Compare Uruk and Mohenjo-daro city planning');
 assert.ok(results.some(s=>s.week===2));assert.ok(results.some(s=>s.week===3));
 assert.ok(results.every(s=>s.week>=1&&s.week<=3));
 assert.ok(retrieve('What is archaeology?',1).length);
 assert.equal(getSource('d001-p47-c0'),null);
});

 test("URL-only passages never rank as factual evidence",()=>{const sources=retrieve("Compare Uruk and Mohenjo-daro");assert.ok(sources.length);assert.ok(sources.every(source=>source.text.replace(/https?:\/\/\S+/gi, "").trim().length>0));});

test("lecture retrieval retains evidence blocks alongside slide titles",()=>{const sources=retrieve("Uruk urban development villages",2);assert.ok(sources.some(s=>/Uruk/i.test(s.text)&&/villages|central districts/i.test(s.text)));});

test('short site captions remain searchable and point to their original slides',()=>{
 for(const [query,docId] of [['Joya de Ceren','d111'],['Machu Picchu','d111'],['Tel Abada','d102'],['Tikal','d101']]){
  const sources=retrieve(query);assert.ok(sources.some(s=>s.docId===docId),query);
  for(const source of sources.filter(s=>s.docId===docId))assert.equal(getSource(source.id).text,source.text);
 }
 assert.ok(retrieve('explain hierarchy',3).some(s=>s.docId==='d103'&&s.page===7));
});
