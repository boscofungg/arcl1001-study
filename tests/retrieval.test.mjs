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
 assert.ok(results.some(s=>s.kind==='Lecture'&&s.week===2&&s.page>=37&&s.page<=55));
 assert.equal(results[0].week,2);
 assert.ok(!results.some(s=>/quiz.*cover/i.test(s.text)));
});
