import test from 'node:test';
import assert from 'node:assert/strict';
import {addPracticeSet,parsePracticeLibrary,updatePracticeSet,addPracticeReview} from '../lib/practice-library.ts';
import {getSlidePracticePool} from '../lib/slide-practice.ts';
const bank=getSlidePracticePool(3);
test('new sets avoid every assigned question even before answers, and preserve earlier sets',()=>{
 let library=parsePracticeLibrary('',bank);
 library=addPracticeSet(library,bank,'mixed',5,{},()=>.2);
 const first=library.sets[0];
 library=addPracticeSet(library,bank,'mixed',5,{},()=>.2);
 assert.equal(library.sets.length,2);
 assert.deepEqual(library.sets[0],first);
 assert.equal(library.sets[1].state.review.queue.some(id=>first.state.review.queue.includes(id)),false);
 assert.deepEqual(parsePracticeLibrary(JSON.stringify(library),bank),library);
});
test('legacy current set migrates and wording stays stable on reload',()=>{
 let library=addPracticeSet(parsePracticeLibrary('',bank),bank,'mixed',5,Object.fromEntries(bank.map(q=>[q.id,['Alternate']])),()=>.8);
 const migrated=parsePracticeLibrary('',bank,JSON.stringify(library.sets[0].state));
 assert.equal(migrated.sets.length,1);
 assert.deepEqual(migrated.sets[0].state,library.sets[0].state);
 assert.deepEqual(parsePracticeLibrary(JSON.stringify(library),bank).sets[0].wordings,library.sets[0].wordings);
 const original=library.sets[0];
 library=addPracticeReview(library,original.state);
 assert.equal(library.sets.length,2);
 assert.deepEqual(library.sets[0],original);
 library=updatePracticeSet(library,{...original.state,seenIds:bank.map(q=>q.id)});
 assert.deepEqual(library.sets[0],original);
});
test('exhausted pool reuses valid questions without duplicates within a set',()=>{
 const small=bank.slice(0,3);
 let library=addPracticeSet(parsePracticeLibrary('',small),small,'mixed',5,{});
 library=addPracticeSet(library,small,'mixed',5,{});
 assert.equal(library.sets[1].state.review.queue.length,3);
 assert.equal(new Set(library.sets[1].state.review.queue).size,3);
 assert.equal(parsePracticeLibrary('{broken',small).sets.length,0);
});
test('image choices survive reloading and a review set preserves them',()=>{
 const library=addPracticeSet(parsePracticeLibrary('',bank),bank,'mixed',30,{},()=>.9,{'visual-009':[{}]});
 const chosen=library.sets[0];
 assert.equal(chosen.images['visual-009'],1);
 assert.deepEqual(parsePracticeLibrary(JSON.stringify(library),bank).sets[0].images,chosen.images);
 assert.deepEqual(addPracticeReview(library,chosen.state).sets[1].images,chosen.images);
});
