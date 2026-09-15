import test from 'node:test';
import assert from 'node:assert/strict';
import { referencedVisuals } from '../lib/referenced-visuals.ts';
const source=n=>({id:`d001-p${n}`,docId:'d001',page:n,text:'Evidence',title:'Lecture',kind:'Lecture',week:2,label:`Slide ${n}`,images:[{src:`/materials/d001/page-${n}.webp`,width:1400,height:788,alt:'Original slide'}]});
test('shows cited visuals in citation order and deduplicates repeated/grouped citations',()=>{
 const result=referencedVisuals('Compare [2, 1] with [2].',[source(1),source(2)],[1,2]);
 assert.deepEqual(result.map(r=>r.citation),[2,1]);
});
test('does not show unseen, invented, uncited or partially streamed citations',()=>{
 assert.deepEqual(referencedVisuals('Evidence [1] [99] [2',[source(1),source(2)],[2]),[]);
 assert.deepEqual(referencedVisuals('No cited evidence',[source(1)],[1]),[]);
 assert.deepEqual(referencedVisuals('Evidence [1]',[source(1)]),[]);
});
test('caps reply visuals and rejects model-supplied external URLs',()=>{
 const sources=[1,2,3,4].map(source);
 assert.equal(referencedVisuals('[1, 2, 3, 4]',sources,[1,2,3,4]).length,3);
 sources[0].images[0].src='https://untrusted.example/image.webp';
 assert.deepEqual(referencedVisuals('[1]',sources,[1]),[]);
});
