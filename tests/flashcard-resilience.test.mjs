import test from 'node:test';import assert from 'node:assert/strict';
import {tutorResponseError,TutorServiceError} from '../lib/tutor-service-error.ts';
import {parseFlashcardScope,reviewedFlashcardFallback} from '../lib/flashcard-generation.ts';
import {startReview,parseReview,retryReview} from '../lib/flashcard-review.ts';
import {emptyLibrary,saveLibraryReview,parseLibrary} from '../lib/flashcard-library.ts';
import l6 from '../content/l6-flashcard-fallback.json' with {type:'json'};import l7 from '../content/l7-flashcard-fallback.json' with {type:'json'};import visuals from '../lib/visuals.json' with {type:'json'};
test('HTTP 400 insufficient token is treated as provider quota without exposing raw text',async()=>{
 for(const [status,body] of [[400,'Insufficient token.'],[400,'{"message":"Insufficient tokens"}'],[429,'private-token secret']]){
  const e=await tutorResponseError(new Response(body,{status}));assert.ok(e instanceof TutorServiceError);assert.equal(e.code,'quota');assert.doesNotMatch(e.message,/private-token|secret/);
 }
 for(const [status,code] of [[400,'request'],[403,'access'],[404,'configuration'],[500,'unavailable']]){const e=await tutorResponseError(new Response('private sensitive metadata',{status}));assert.equal(e.code,code);assert.doesNotMatch(e.message,/private|sensitive/);}
});
test('provider diagnostics stop after a bounded prefix and cancel the response',async()=>{
 let cancelled=false;
 const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('x'.repeat(6000)));},cancel(){cancelled=true;}});
 const e=await tutorResponseError(new Response(body,{status:400}));assert.equal(e.code,'request');assert.equal(cancelled,true);
});
test('L6 and L7 have ten usable prepared cards for both all-slides and document scopes',()=>{
 for(const [week,docId] of [[6,'d122'],[7,'d123']])for(const count of [6,10])for(const scope of [{week,count},{week,count,docId}]){
  const cards=reviewedFlashcardFallback(scope);assert.equal(cards.length,count);assert.equal(new Set(cards.map(c=>c.id)).size,count);assert.ok(cards.every(c=>c.source.docId===docId));
  const review=startReview({id:`${week}-${count}`,week,...scope.docId?{docId}:{},title:'Prepared practice',createdAt:'2026-10-25',cards});assert.ok(parseReview(JSON.stringify(review)));assert.deepEqual(retryReview(review).deck,review.deck);
  const lib=saveLibraryReview(emptyLibrary(week),review);assert.deepEqual(parseLibrary(JSON.stringify(lib),week),lib);
 }
});
test('fallback cards cite exact single-slide text and avoid reading or invented evidence',()=>{
 const normal=s=>s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
 for(const q of [...l6,...l7]){
  assert.equal(q.kind,'short-answer');assert.equal(q.additionalSources,undefined);assert.ok(q.evidence.length>=20&&q.evidence.length<=900);
  const page=visuals[q.source.docId].pages.find(p=>p.page===q.source.page);assert.ok(page);const text=normal(page.textBlocks.map(b=>b.text).join(' '));assert.ok(text.includes(normal(q.evidence)),q.id);
 }
});
test('prepared mode is explicit, validated and varies cards without changing saved decks',()=>{
 assert.equal(parseFlashcardScope({week:6,count:10,mode:'prepared'}).mode,'prepared');assert.throws(()=>parseFlashcardScope({week:6,count:10,mode:'other'}));
 const a=reviewedFlashcardFallback({week:6,count:10},undefined,undefined,()=>.1),b=reviewedFlashcardFallback({week:6,count:10},undefined,undefined,()=>.9);assert.notDeepEqual(a.map(c=>c.id),b.map(c=>c.id));
});
