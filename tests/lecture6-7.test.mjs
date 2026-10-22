import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
import documents from '../lib/documents.json' with {type:'json'};import visuals from '../lib/visuals.json' with {type:'json'};
import {tutorSources} from '../lib/tutor-sources.ts';import {parseFlashcardScope,selectFlashcardExcerpts} from '../lib/flashcard-generation.ts';
test('Lecture 6 and 7 originals have every slide, valid previews and searchable visual text',()=>{
 for(const [id,week,total] of [['d122',6,119],['d123',7,123]]){
  const doc=documents.find(d=>d.id===id);assert.equal(doc.kind,'Lecture');assert.equal(doc.week,week);assert.equal(doc.pages,total);assert.equal(visuals[id].pages.length,total);
  for(const page of visuals[id].pages){assert.ok(page.images.length);for(const image of page.images)assert.ok(existsSync(new URL('../public'+image.src,import.meta.url)));}
  const found=tutorSources('Summarize main ideas',week,id);assert.ok(found.length);assert.ok(found.every(s=>s.docId===id));
  const scope=parseFlashcardScope({week,docId:id,count:6});assert.ok(selectFlashcardExcerpts(scope).length);
 }
});
