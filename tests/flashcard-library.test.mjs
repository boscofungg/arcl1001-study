import test from 'node:test';
import assert from 'node:assert/strict';
import {startReview,rateCard} from '../lib/flashcard-review.ts';
import {emptyLibrary,restoreLibrary,parseLibrary,saveLibraryReview,deleteLibraryReview,mergeLibrary,MAX_SAVED_DECKS} from '../lib/flashcard-library.ts';
const make=(id='a')=>startReview({id,week:2,title:'Urbanization',createdAt:'2026-10-04',cards:[{id:'one',question:'Question?',answer:'Answer',evidence:'Evidence',source:{docId:'d102',page:47,title:'Lecture',label:'Slide 47'}}]});
test('legacy deck migrates with progress and generating another preserves it',()=>{
 const old=rateCard(make(),'again');
 let library=restoreLibrary('',JSON.stringify(old),2);
 assert.deepEqual(library.reviews,[old]);
 library=saveLibraryReview(library,make('b'));
 assert.equal(library.reviews.length,2);assert.equal(library.selectedId,'b');
 assert.deepEqual(library.reviews[0],old);
 assert.deepEqual(parseLibrary(JSON.stringify(library),2),library);
 library=saveLibraryReview(library,rateCard(make('b'),'known'));
 assert.equal(library.reviews.length,2);assert.equal(library.reviews[1].position,1);
});
test('deleting last set does not resurrect legacy set',()=>{
 const cleared=deleteLibraryReview(restoreLibrary('',JSON.stringify(make()),2),'a');
 assert.deepEqual(restoreLibrary(JSON.stringify(cleared),JSON.stringify(make()),2),emptyLibrary(2));
});
test('backup merge preserves existing local progress and rejects invalid source and week',()=>{
 const local=saveLibraryReview(emptyLibrary(2),rateCard(make(),'known'));
 const imported=saveLibraryReview(saveLibraryReview(emptyLibrary(2),make()),make('b'));
 const merged=mergeLibrary(local,imported);
 assert.equal(merged.reviews.length,2);assert.equal(merged.reviews[0].position,1);
 assert.equal(parseLibrary(JSON.stringify(merged),3),null);
 const reading=make();reading.deck.cards[0].source.docId='d106';
 assert.equal(parseLibrary(JSON.stringify({...local,reviews:[reading]}),2),null);
 assert.throws(()=>saveLibraryReview(local,reading));
 assert.equal(parseLibrary(JSON.stringify({...local,selectedId:'missing'}),2),null);
 assert.equal(parseLibrary(JSON.stringify({...local,reviews:[make(),make()]}),2),null);
});
test('library limits never silently discard saved sets',()=>{
 let full=emptyLibrary(2);
 for(let i=0;i<MAX_SAVED_DECKS;i++)full=saveLibraryReview(full,make(String(i)));
 assert.throws(()=>saveLibraryReview(full,make('overflow')));
 assert.throws(()=>mergeLibrary(full,saveLibraryReview(emptyLibrary(2),make('overflow'))));
 assert.equal(saveLibraryReview(full,rateCard(make('0'),'known')).reviews.length,MAX_SAVED_DECKS);
});
