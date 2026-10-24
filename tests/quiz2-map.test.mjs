import test from 'node:test';
import assert from 'node:assert/strict';
import {quiz2MapTargets,mapSets} from '../lib/quiz2-map-data.ts';
import docs from '../lib/documents.json' with {type:'json'};
import visuals from '../lib/visuals.json' with {type:'json'};

test('Quiz 2 map sets have three distinct valid targets and collectively cover the new regions',()=>{
  const ids=quiz2MapTargets.map(t=>t.id);
  assert.equal(new Set(ids).size,6);
  assert.equal(mapSets.length,3);
  for(const set of mapSets){assert.equal(set.length,3);assert.equal(new Set(set).size,3);for(const id of set)assert.ok(ids.includes(id));}
  assert.deepEqual(new Set(mapSets.flat()),new Set(ids));
  for(const target of quiz2MapTargets){assert.ok(target.x>0&&target.x<1&&target.y>0&&target.y<1);assert.ok(target.feedback.length>60);assert.ok(target.source);}
});

test('Quiz 2 map evidence cites only existing Lecture 4–7 slide text',()=>{
  const normal=s=>s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
  for(const target of quiz2MapTargets){
    assert.ok(target.sources.length);
    for(const source of target.sources){
      const doc=docs.find(d=>d.id===source.docId);
      assert.equal(doc.kind,'Lecture');assert.ok(doc.week>=4&&doc.week<=7);
      const page=visuals[source.docId].pages.find(p=>p.page===source.page);assert.ok(page);
      const text=normal(page.textBlocks.map(b=>b.text).join(' '));
      for(const token of source.evidence.split(/\s+/).map(normal).filter(t=>t.length>2))assert.ok(text.includes(token),`${target.id}: ${source.page}: ${token}`);
    }
  }
});
