'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, BookOpen, Check, RotateCcw, Sparkles } from 'lucide-react';
import documents from '@/lib/documents.json';
import type { FlashcardDifficulty } from '@/lib/flashcard-generation';
import type { FlashcardDeck } from '@/lib/flashcard-types';
import { parseReview, rateCard, reviewMissed, startReview, type FlashcardReview } from '@/lib/flashcard-review';

const temporarySets=new Map<string,string>();
function subscribe(listener:()=>void){window.addEventListener('storage',listener);window.addEventListener('stratum-flashcards',listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener('stratum-flashcards',listener);};}
function read(key:string){if(temporarySets.has(key))return temporarySets.get(key)!;try{return localStorage.getItem(key)||'';}catch{return '';}}
function save(key:string,review:FlashcardReview){const value=JSON.stringify(review);try{localStorage.setItem(key,value);temporarySets.delete(key);}catch{temporarySets.set(key,value);}window.dispatchEvent(new Event('stratum-flashcards'));}
const emptySnapshot=()=>'';
export default function FlashcardStudy({week,topic,onOpen}:{week:number;topic:string;onOpen:(docId:string,page:number,quote?:string)=>void}){
  const key=`stratum-flashcards-slides-v3-week${week}`;
  const raw=useSyncExternalStore(subscribe,()=>read(key),emptySnapshot);
  const parsed=parseReview(raw);
  const review=parsed?.deck.week===week?parsed:null;
  const materials=documents.filter(doc=>doc.week===week&&doc.kind==='Lecture');
  const [selection,setSelection]=useState<string|null>(null);
  const selected=selection??(review?review.deck.docId||'':materials.find(doc=>doc.kind==='Lecture')?.id||'');
  const [count,setCount]=useState<6|10>(6),[busy,setBusy]=useState(false),[error,setError]=useState(''),[warning,setWarning]=useState('');
  const [difficulty,setDifficulty]=useState<FlashcardDifficulty>('recall');
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [revealed,setRevealed]=useState<string|null>(null);
  const request=useRef<AbortController|null>(null);
  const reviewAnchor=useRef<HTMLDivElement>(null);
  const deckId=review?.deck.id, position=review?.position;
  useEffect(()=>{reviewAnchor.current?.scrollIntoView({behavior:'smooth',block:'start'});},[deckId,position]);
  useEffect(()=>()=>request.current?.abort(),[]);
  const card=review?.deck.cards.find(item=>item.id===review.queue[review.position]);
  const face=card?`${review!.deck.id}:${review!.position}:${card.id}`:'';
  const showingAnswer=!!card&&revealed===face;
  const known=review?Object.values(review.ratings).filter(rating=>rating==='known').length:0;
  const missed=review?review.deck.cards.filter(item=>review.ratings[item.id]==='again').length:0;
  async function generate(){
    if(request.current)return;
    const controller=new AbortController();request.current=controller;setBusy(true);setError('');setWarning('');
    try{
      const response=await fetch('/api/flashcards',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(60000)]),body:JSON.stringify({week,docId:selected||undefined,count,difficulty})});
      const data=await response.json() as {deck?:FlashcardDeck;warning?:string;error?:string};
      if(!response.ok||!data.deck)throw new Error(data.error||'Could not generate this set. Please try again.');
      const next=startReview(data.deck);
      if(!parseReview(JSON.stringify(next)))throw new Error('The generated cards could not be read. Please try again.');
      if(controller.signal.aborted)return;
      save(key,next);setAnswers({});setRevealed(null);setWarning(data.warning||'');
    }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error&&!/fetch|network|JSON/i.test(cause.message)?cause.message:'Could not reach the generator. Please try again.');}
    finally{if(request.current===controller){request.current=null;setBusy(false);}}
  }
  function rate(rating:'again'|'known'){if(!review||!showingAnswer)return;save(key,rateCard(review,rating));setRevealed(null);}
  return <section className="flashcard-study" aria-labelledby="flashcard-title">
    <div className="section-kicker">SLIDE-BASED ACTIVE RECALL / LECTURE {String(week).padStart(2,'0')}</div><h1 id="flashcard-title">Flashcards</h1><p className="intro">Practise only the lecture slides. Recall the answer before you reveal it, then revisit cards that need another look.</p>
    <form className="flashcard-generator" onSubmit={event=>{event.preventDefault();void generate();}}>
      <label>Lecture slides<select aria-label="Flashcard source material" value={selected} disabled={busy} onChange={event=>setSelection(event.target.value)}><option value="">All Lecture {week} slides</option>{materials.map(doc=><option key={doc.id} value={doc.id}>{doc.kind} · {doc.title}</option>)}</select></label>
      <label>Question difficulty<select aria-label="Flashcard difficulty" value={difficulty} disabled={busy} onChange={event=>setDifficulty(event.target.value as FlashcardDifficulty)}><option value="recall">Recall — key facts</option><option value="explain">Explain — relationships and meaning</option><option value="apply">Apply / discuss — evidence and interpretation</option></select></label>
      <div className="flashcard-generate-row"><label>Set size<select aria-label="Number of flashcards" value={count} disabled={busy} onChange={event=>setCount(Number(event.target.value) as 6|10)}><option value={6}>6 cards</option><option value={10}>10 cards</option></select></label><button className="primary-button" disabled={busy} type="submit"><Sparkles size={15}/>{busy?'Generating…':review?'Generate a new set':'Generate flashcards'}</button></div>
      <p>Concise short-answer practice from the selected lecture slides. These are study aids, not official quiz questions.</p>
    </form>
    {busy&&<div className="flashcard-status" role="status">Reading the slides and checking the cards’ source references…</div>}
    {error&&<p className="flashcard-error" role="alert">{error}{review?' Your existing set is still available.':''}</p>}
    {warning&&<p className="flashcard-status" role="status">{warning}</p>}
    {raw&&!review&&<p className="flashcard-error">This saved set is not compatible with slides-only practice. Generate a new set to continue.</p>}
    {!review&&!busy&&<div className="flashcard-empty"><BookOpen size={28}/><h2>Start with {topic.toLowerCase()}</h2><p>Generate a small set, answer from memory, then check the evidence. Each card focuses on one idea.</p><ol><li>Try to recall it</li><li>Reveal and check</li><li>Mark it for another pass</li></ol></div>}
    {review&&<div className="flashcard-current-set" ref={reviewAnchor}>
      <div className="flashcard-set-heading"><div><span className="eyebrow">YOUR CURRENT SET</span><h2>{review.deck.title}</h2></div><span>{review.deck.cards.length} cards</span></div>
      <div className="flashcard-progress" role="progressbar" aria-label="Cards reviewed this round" aria-valuemin={0} aria-valuemax={review.queue.length} aria-valuenow={review.position}><span style={{width:`${review.position/review.queue.length*100}%`}}/></div>
      {card?<>
        <article className="recall-card" aria-live="polite"><div className="recall-card-top"><span>QUESTION</span><span>{String(review.position+1).padStart(2,'0')} / {String(review.queue.length).padStart(2,'0')}</span></div><h2>{card.question}</h2>
          <label style={{display:'block',margin:'1rem 0'}}>Your answer (optional)<textarea aria-label="Your flashcard answer" value={answers[face]||''} disabled={showingAnswer} onChange={event=>setAnswers(previous=>({...previous,[face]:event.target.value}))} rows={4} maxLength={3000} placeholder="Write your answer in your own words…" style={{display:'block',width:'100%',marginTop:8,padding:12,border:'1px solid var(--line)',borderRadius:8,background:'var(--paper)',color:'inherit',font:'inherit',resize:'vertical'}}/></label>
          <p className="flashcard-save-note">Your written answer is not automatically marked or saved. Compare it with the model answer, then choose Again or Got it.</p>
          {showingAnswer?<div className="recall-answer"><span className="eyebrow">MODEL ANSWER</span><p>{card.answer}</p><details><summary>Check the supporting evidence</summary><blockquote>{card.evidence}</blockquote></details><button className="flashcard-source" onClick={()=>onOpen(card.source.docId,card.source.page,card.evidence)}><BookOpen size={14}/><span>{card.source.label} · {card.source.title}</span><ArrowRight size={14}/></button></div>:<div className="recall-prompt"><p>Say the answer in your own words before checking.</p><button className="primary-button" onClick={()=>setRevealed(face)}>Reveal answer <ArrowRight size={16}/></button></div>}
        </article>
        {showingAnswer&&<div className="recall-rating"><p>How did you do?</p><div><button className="recall-again" onClick={()=>rate('again')}><RotateCcw size={16}/> Again</button><button className="recall-known" onClick={()=>rate('known')}><Check size={16}/> Got it</button></div></div>}
      </>:<div className="recall-complete" role="status"><Check size={28}/><h2>Round complete</h2><p>You marked <strong>{known}</strong> of {review.deck.cards.length} cards recalled and <strong>{missed}</strong> for more practice.</p><div>{missed>0&&<button className="primary-button" onClick={()=>{save(key,reviewMissed(review));setRevealed(null);}}><RotateCcw size={15}/> Review missed cards ({missed})</button>}<button className="flashcard-secondary" onClick={()=>{save(key,startReview(review.deck));setRevealed(null);}}>Review all again</button></div></div>}
      <p className="flashcard-save-note">{temporarySets.has(key)?'Device storage is unavailable. This set lasts until you reload.':'Your current set and review progress are saved on this device.'}</p>
    </div>}
    <p className="coverage-note">Slides-only study aids. Earlier saved sets are kept separately; generate a new slides-only set to continue. Check the linked source if an answer seems unclear. Your ratings reflect your own recall, not an exam score.</p>
  </section>;
}
