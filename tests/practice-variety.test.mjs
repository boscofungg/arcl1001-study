import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import bank from '../content/practice-variety.json' with {type:'json'};
import wordings from '../content/practice-wordings.json' with {type:'json'};
import variants from '../content/practice-image-variants.json' with {type:'json'};
import visuals from '../lib/visuals.json' with {type:'json'};
import {slideQuestions} from '../lib/slide-practice.ts';
import {markSlideAnswer} from '../lib/slide-marking.ts';

test('new comparison marking keeps facts attached to the correct subject',()=>{
 const swaps=[
  ['variety-05','Africa had copper and gold; the Americas used iron. There was no universal sequence.'],
  ['variety-12','The Warka Vase is copper; the ox horn is alabaster.'],
  ['variety-12','The ox horn is alabaster; the Warka Vase is copper.'],
  ['variety-18','Tribes had permanent hereditary leadership; chiefdoms had temporary fluid leadership.'],
  ['variety-18','Chiefdoms were temporary and tribes were permanent.'],
  ['variety-24','Northern lowlands have tropical forests and swamps; southern lowlands are dry.'],
  ['variety-24','South is dry; north has heavy rain.'],
 ];
 for(const [id,answer] of swaps) assert.notEqual(markSlideAnswer(id,answer)?.status,'correct',`${id}: ${answer}`);
 for(const q of bank) assert.equal(markSlideAnswer(q.id,q.answer)?.status,'correct',q.id);
 for(const [id,answer] of [
  ['variety-12','Copper for the ox horn; alabaster for the Warka Vase.'],
  ['variety-18','Chiefdoms: inherited leadership. Tribes: temporary leaders.'],
  ['variety-24','Southern lowlands have swamps. Northern lowlands are flat.'],
 ]) assert.equal(markSlideAnswer(id,answer)?.status,'correct',answer);
});

test('alternate wordings and images reference active questions and original slide evidence',()=>{
 const ids=new Set(slideQuestions.map(q=>q.id));
 for(const [id,alternates] of Object.entries(wordings)){
  assert.ok(ids.has(id),id);assert.ok(alternates.length);
  assert.ok(alternates.every(text=>typeof text==='string'&&text.trim().length>10));
 }
 for(const [id,alternates] of Object.entries(variants)){
  assert.ok(ids.has(id),id);
  for(const variant of alternates){
   assert.ok(existsSync(new URL(`../public${variant.image.src}`,import.meta.url)));
   assert.ok(variant.image.width>0&&variant.image.height>0);
   const page=visuals[variant.source.docId]?.pages.find(p=>p.page===variant.source.page);
   assert.ok(page);assert.equal(variant.evidence,page.textBlocks.map(b=>b.text).join('\n'));
  }
 }
});
