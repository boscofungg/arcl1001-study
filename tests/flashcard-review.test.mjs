import test from 'node:test';
import assert from 'node:assert/strict';
import {startReview,rateCard,reviewMissed,parseReview} from '../lib/flashcard-review.ts';
const deck={id:'test',week:2,title:'Urbanization',createdAt:'2026-09-16',cards:['a','b'].map(id=>({id,question:'A question?',answer:'An answer',evidence:'Source evidence',source:{docId:'d102',page:47,title:'Lecture',label:'Slide 47'}}))};
test('review ratings advance once and missed-card rounds contain only missed cards',()=>{
 let review=startReview(deck);review=rateCard(review,'again');review=rateCard(review,'known');
 assert.equal(review.position,2);assert.deepEqual(review.ratings,{a:'again',b:'known'});
 assert.equal(rateCard(review,'known'),review);
 const again=reviewMissed(review);assert.deepEqual(again.queue,['a']);assert.equal(again.position,0);
 assert.equal(rateCard(again,'known').ratings.a,'known');
});
test('saved review restores progress and rejects corrupt queues/ratings/cards',()=>{
 const review=rateCard(startReview(deck),'again');
 assert.deepEqual(parseReview(JSON.stringify(review)),review);
 for(const bad of [null,{...review,position:99},{...review,queue:['unknown']},{...review,queue:['a','a']},{...review,ratings:{a:'invalid'}},{...review,deck:{...deck,cards:[{}]}}])assert.equal(parseReview(JSON.stringify(bad)),null);
 assert.equal(parseReview('{broken'),null);
});

test('saved decks reject old course IDs and unsupported lecture weeks',()=>{
 for(const invalid of [{...deck,week:4},{...deck,docId:'d001'},{...deck,cards:deck.cards.map(card=>({...card,source:{...card.source,docId:'d001'}}))},{...deck,cards:deck.cards.map(card=>({...card,source:{...card.source,page:999}}))}])assert.equal(parseReview(JSON.stringify(startReview(invalid))),null);
});

test('saved reading and mixed decks cannot reappear in slides-only review',()=>{
 const readingCard={...deck.cards[0],source:{...deck.cards[0].source,docId:'d106',page:4}};
 for(const invalid of [
  {...deck,docId:'d106'},
  {...deck,cards:[readingCard]},
  {...deck,cards:[readingCard,deck.cards[1]]},
 ])assert.equal(parseReview(JSON.stringify(startReview(invalid))),null);
});
