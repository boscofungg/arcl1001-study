import type { FlashcardDeck } from './flashcard-types.ts';
export type FlashcardReview={version:1;deck:FlashcardDeck;queue:string[];position:number;ratings:Record<string,'again'|'known'>};
export function startReview(deck:FlashcardDeck):FlashcardReview{return{version:1,deck,queue:deck.cards.map(card=>card.id),position:0,ratings:{}};}
export function rateCard(review:FlashcardReview,rating:'again'|'known'):FlashcardReview{
  const id=review.queue[review.position];
  if(!id)return review;
  return{...review,position:review.position+1,ratings:{...review.ratings,[id]:rating}};
}
export function reviewMissed(review:FlashcardReview):FlashcardReview{
  return{...review,queue:review.deck.cards.filter(card=>review.ratings[card.id]==='again').map(card=>card.id),position:0};
}
export function parseReview(raw:string):FlashcardReview|null{
  if(!raw||raw.length>150000)return null;
  try{
    const value=JSON.parse(raw) as FlashcardReview;
    const deck=value?.deck;
    if(value.version!==1||!deck||typeof deck.id!=='string'||typeof deck.title!=='string'||!Number.isInteger(deck.week)||deck.week<2||deck.week>7||!Array.isArray(deck.cards)||!deck.cards.length||deck.cards.length>12)return null;
    if(deck.cards.some(card=>!card||typeof card.id!=='string'||typeof card.question!=='string'||!card.question||typeof card.answer!=='string'||!card.answer||typeof card.evidence!=='string'||!card.source||typeof card.source.docId!=='string'||!Number.isInteger(card.source.page)||card.source.page<1||typeof card.source.title!=='string'||typeof card.source.label!=='string'))return null;
    const ids=new Set(deck.cards.map(card=>card.id));
    if(ids.size!==deck.cards.length||!Array.isArray(value.queue)||!value.queue.length||value.queue.length>deck.cards.length||value.queue.some(id=>!ids.has(id))||new Set(value.queue).size!==value.queue.length||!Number.isInteger(value.position)||value.position<0||value.position>value.queue.length||!value.ratings||Array.isArray(value.ratings)||typeof value.ratings!=='object')return null;
    if(Object.entries(value.ratings).some(([id,rating])=>!ids.has(id)||!['again','known'].includes(rating)))return null;
    return value;
  }catch{return null;}
}
