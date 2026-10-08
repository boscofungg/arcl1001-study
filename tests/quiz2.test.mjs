import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import documents from '../lib/documents.json' with {type:'json'};
import visuals from '../lib/visuals.json' with {type:'json'};
import {tutorSources} from '../lib/tutor-sources.ts';
import {getSlidePracticePool} from '../lib/slide-practice.ts';
test('Quiz 2 originals retain complete page previews and reading boundaries',()=>{
 for(const [id,count,start] of [['d114',104,1],['d115',10,4],['d116',2,1],['d117',13,4],['d118',19,4],['d119',16,1]]){
  const doc=documents.find(d=>d.id===id);assert.equal(doc.pages,count);assert.equal(doc.startPage,start);
  assert.equal(visuals[id].pages.length,count);
  for(const page of visuals[id].pages){assert.ok(page.images.length);for(const image of page.images)assert.ok(existsSync(new URL('../public'+image.src,import.meta.url)));}
 }
 assert.ok(visuals.d116.pages.every(p=>p.textBlocks.length));
});
test('Quiz 2 hard scope never returns earlier lectures, even for a focused page',()=>{
 const sources=tutorSources('Maya Inca Persepolis art food',0,undefined,undefined,[4,5,6,7]);
 assert.ok(sources.length);assert.ok(sources.every(s=>[4,5,6,7].includes(s.week)));
 assert.deepEqual(tutorSources('explain',1,'d101',10,[4,5,6,7]),[]);
 assert.ok(tutorSources('Summarize main ideas',6,'d116').every(s=>s.docId==='d116'));
});
test('new web readings are labelled linked summaries and excluded from practice',()=>{
 for(const id of ['d120','d121']){const doc=documents.find(d=>d.id===id);assert.equal(doc.kind,'Web');assert.equal(doc.isSummary,true);assert.ok(doc.url.startsWith('https://'));}
 assert.equal(getSlidePracticePool(5).length,12);
 assert.equal(getSlidePracticePool(6).length,0);assert.equal(getSlidePracticePool(7).length,0);
});
