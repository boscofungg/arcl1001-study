import test from 'node:test';
import assert from 'node:assert/strict';
import {preparedVisualFlashcards,visualFlashcardPool,visualFlashcardQuestion} from '../lib/flashcard-visuals.ts';
import {startReview,parseReview,retryReview} from '../lib/flashcard-review.ts';
import {parseFlashcardScope} from '../lib/flashcard-generation.ts';

test('identification cards use canonical course crops and preserve images and answers on retry',()=>{
 const cards=preparedVisualFlashcards(1,undefined,6,()=>.5);
 assert.ok(cards.length>0&&cards.length<=6);
 assert.equal(new Set(cards.map(card=>card.id)).size,cards.length);
 for(const card of cards){
  const question=visualFlashcardQuestion(card);
  assert.match(question.image.src,/^\/(quiz1|materials)\//);
  assert.equal(question.answer,card.answer);
  assert.equal(card.source.docId,'d101');
 }
 const review=startReview({id:'visual-test',week:1,title:'Images',createdAt:'2026-10-08',cards});
 assert.deepEqual(parseReview(JSON.stringify(review)),review);
 assert.deepEqual(retryReview(review).deck,review.deck);
 for(const replacement of [{practiceQuestionId:'invented'},{answer:'A changed answer'},{question:'A different question'},{source:{...cards[0].source,page:1}}]){
  assert.equal(parseReview(JSON.stringify({...review,deck:{...review.deck,cards:[{...cards[0],...replacement},...cards.slice(1)]}})),null);
 }
});

test('visual selection never expands to readings or different lectures',()=>{
 assert.deepEqual(preparedVisualFlashcards(1,'d104',6),[]);
 assert.deepEqual(preparedVisualFlashcards(6,undefined,6),[]);
 assert.deepEqual(visualFlashcardPool(2,'d101'),[]);
});

test('format is validated and reading-only lectures cannot generate flashcards',()=>{
 assert.equal(parseFlashcardScope({week:1,count:6,format:'image-map'}).format,'image-map');
 assert.throws(()=>parseFlashcardScope({week:1,count:6,format:'MCQ'}));
 assert.throws(()=>parseFlashcardScope({week:6,count:6},[{id:'reading6',week:6,title:'Reading',kind:'Literature',pages:4}]));
});


test('Lecture 4 identification includes the reviewed quipu image from the shared slide bank',()=>{
 const cards=preparedVisualFlashcards(4,undefined,10,()=>.5);
 assert.ok(cards.length>0);
 assert.ok(cards.every(card=>card.source.docId==='d111'&&visualFlashcardQuestion(card)));
 assert.ok(cards.some(card=>/quipu/i.test(card.answer)));
});
