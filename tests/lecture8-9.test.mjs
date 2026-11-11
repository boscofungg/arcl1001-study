import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
import docs from '../lib/documents.json' with {type:'json'};import visuals from '../lib/visuals.json' with {type:'json'};import manifest from '../content/quiz1-source-manifest.json' with {type:'json'};
import {tutorSources} from '../lib/tutor-sources.ts';import {parseFlashcardScope,selectFlashcardExcerpts} from '../lib/flashcard-generation.ts';
test('L8–9 imports include all original pages and start with substantive page one',()=>{
 for(const [id,week,pages,kind] of [['d124',8,86,'Lecture'],['d125',8,19,'Reading'],['d126',9,94,'Lecture'],['d127',9,17,'Reading']]){
  const doc=docs.find(d=>d.id===id);assert.equal(doc.week,week);assert.equal(doc.pages,pages);assert.equal(doc.kind,kind);assert.equal(doc.startPage,1);
  assert.equal(visuals[id].pages.length,pages);for(const p of visuals[id].pages)for(const img of p.images)assert.ok(existsSync(new URL('../public'+img.src,import.meta.url)));
  const sources=tutorSources('Summarize the main ideas',week,id);assert.ok(sources.length);assert.ok(sources.every(s=>s.docId===id));
 }
 for(const [week,docId] of [[8,'d124'],[9,'d126']])assert.ok(selectFlashcardExcerpts(parseFlashcardScope({week,docId,count:6})).length);
});
test('L7 duplicate attachments are recorded without duplicating library documents',()=>{
 for(const id of ['d118','d119']){assert.equal(docs.filter(d=>d.id===id).length,1);const source=manifest.sources.find(s=>s.id===id);assert.ok(source.identicalAttachments.some(a=>a.filename.includes('(1)')&&a.sha256===source.sha256));}
});
test('new lectures do not leak into the retained Quiz 2 tutor boundary',()=>{
 const sources=tutorSources('religion nomads food',0,undefined,undefined,[4,5,6,7]);assert.ok(sources.every(s=>s.week>=4&&s.week<=7));
});
