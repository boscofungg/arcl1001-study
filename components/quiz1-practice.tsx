'use client';
import Image from 'next/image';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {ArrowRight,BookOpen,Check,RotateCcw} from 'lucide-react';
import documents from '@/lib/documents.json';
import {slideQuestions,getSlidePracticePool} from '@/lib/slide-practice';
import {makeQuiz1Set,parseQuiz1Review,rateQuiz1,retryQuiz1,quiz1KindLabels} from '@/lib/quiz1-practice';
import type {Quiz1Kind,Quiz1Review} from '@/lib/quiz1-types';
import './quiz1-practice.css';
const temporary=new Map<string,string>();
const subscribe=(listener:()=>void)=>{window.addEventListener('storage',listener);window.addEventListener('slide-practice',listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener('slide-practice',listener);};};
function snapshot(key:string){try{return temporary.get(key)||localStorage.getItem(key)||'';}catch{return temporary.get(key)||'';}}
function save(key:string,value:Quiz1Review){const raw=JSON.stringify(value);try{localStorage.setItem(key,raw);temporary.delete(key);}catch{temporary.set(key,raw);}window.dispatchEvent(new Event('slide-practice'));}
const empty=()=>'';
export default function Quiz1Practice({lecture,onLectureChange,onOpen}:{lecture:number;onLectureChange:(lecture:number)=>void;onOpen:(docId:string,page:number,quote?:string)=>void}){
 const key=`quiz1-slide-practice-v1-L${lecture}`;
 const raw=useSyncExternalStore(subscribe,()=>snapshot(key),empty);
 const bank=getSlidePracticePool(lecture as 1|2|3),review=parseQuiz1Review(raw,bank);
 const slide=documents.find(doc=>doc.kind==='Lecture'&&doc.week===lecture)!;
 const [kind,setKind]=useState<Quiz1Kind|'mixed'>('mixed'),[count,setCount]=useState<5|10>(5),[draft,setDraft]=useState(''),[revealed,setRevealed]=useState(''),[notice,setNotice]=useState(''),[imageError,setImageError]=useState('');
 const active=useRef<HTMLDivElement>(null);
 const question=review?bank.find(q=>q.id===review.queue[review.position]):undefined;
 const face=question&&review?`${review.startedAt}:${review.position}:${question.id}`:'';
 const shown=Boolean(face&&revealed===face),available=bank.filter(q=>kind==='mixed'||q.kind===kind).length;
 const missed=review?review.queue.filter(id=>review.ratings[id]==='again').length:0;
 useEffect(()=>{if(face)active.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});},[face]);
 function resetFace(){setDraft('');setRevealed('');setImageError('');}
 function start(){if(!available)return;save(key,makeQuiz1Set(bank,kind,count));resetFace();setNotice('');}
 function rate(rating:'again'|'known'){if(!review||!shown)return;save(key,rateQuiz1(review,rating));resetFace();setNotice(rating==='known'?'Marked as recalled.':'Saved for another look.');}
 return <section className="quiz1-practice" aria-labelledby="quiz1-practice-title">
  <div className="section-kicker">QUIZ 1 · LECTURE SLIDES ONLY</div><h1 id="quiz1-practice-title">Quiz 1 practice</h1>
  <p className="practice-intro">Start with a lecture deck. Practise image identification, map labels and concise answers using only the slides.</p>
  <div className="slide-practice-tabs" role="group" aria-label="Practice lecture">{documents.filter(doc=>doc.kind==='Lecture').map(doc=><button key={doc.id} aria-pressed={lecture===doc.week} onClick={()=>onLectureChange(doc.week)}><strong>Lecture {doc.week}</strong><span>{doc.pages} slides</span></button>)}</div>
  <div className="slide-practice-heading"><div><h2>{slide.title}</h2><p>{bank.length} questions from this deck · {slideQuestions.length} slide-based questions in total</p></div><button className="secondary" onClick={()=>onOpen(slide.id,slide.startPage)}><BookOpen size={15}/>View lecture slides</button></div>
  <p className="practice-disclaimer">Practice follows the announced image, map and short-answer formats; it is not an official paper. Readings remain available in the chatbot, but are excluded here and from flashcards. Compare your response with the cited model answer—self-checks are not automatic marks.</p>
  <form className="practice-controls" onSubmit={event=>{event.preventDefault();start();}}><label>Question type<select aria-label="Question type" value={kind} onChange={e=>setKind(e.target.value as Quiz1Kind|'mixed')}><option value="mixed">Mixed quiz formats</option>{Object.entries(quiz1KindLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Set size<select aria-label="Set size" value={count} onChange={e=>setCount(Number(e.target.value) as 5|10)}><option value={5}>5 questions</option><option value={10}>10 questions</option></select></label><div className="practice-start"><button className="primary" disabled={!available}>Start {Math.min(count,available)}-question set<ArrowRight size={15}/></button>{missed>0&&review&&<button type="button" className="secondary" onClick={()=>{save(key,retryQuiz1(review));resetFace();setNotice('');}}><RotateCcw size={15}/>Review {missed} again</button>}</div><p>{available?`${available} matching questions. Starting a set replaces this lecture’s current set.`:'No questions of this type in this deck. Choose another type or lecture.'}</p></form>
  {notice&&<p className="slide-practice-notice" key={`${notice}-${review?.position}`} role="status"><Check size={15}/>{notice}</p>}
  {question&&review&&<div className="practice-session" ref={active}><div className="practice-position"><span>{quiz1KindLabels[question.kind]} · Lecture {lecture}</span><span>Question {review.position+1} of {review.queue.length}</span></div><progress aria-label="Practice progress" value={review.position} max={review.queue.length}/><article className="question-card"><h2>{question.question}</h2>{question.image&&<figure>{imageError===face?<p role="alert">The image could not load. Reload before answering.</p>:<Image unoptimized src={question.image.src} width={question.image.width} height={question.image.height} alt={question.kind==='map'?'Map with a location to identify':'Lecture image to identify'} onError={()=>setImageError(face)}/>}</figure>}
   <label className="answer-input">Your answer<span>Recall the name, place and period when asked, or write a concise explanation.</span><textarea aria-label="Your answer" rows={3} maxLength={2000} value={draft} disabled={shown} onChange={e=>setDraft(e.target.value)} placeholder="Try answering from memory…"/></label>
   {!shown?<div className="recall-actions"><button className="primary" disabled={imageError===face} onClick={()=>setRevealed(face)}>Show suggested answer</button></div>:<div className="answer-reveal"><h3>Suggested answer</h3><p>{question.answer}</p><details className="slide-evidence"><summary>Check the lecture-slide evidence</summary>{[question.source,...question.additionalSources||[]].map((source,index)=><section key={`${source.docId}-${source.page}-${index}`}><h4>{source.title} · {source.label}</h4><blockquote>{index===0?question.evidence:source.evidence}</blockquote><button className="evidence-button" onClick={()=>onOpen(source.docId,source.page,index===0?question.evidence:source.evidence)}>Read cited slide<BookOpen size={14}/></button></section>)}</details><p className="practice-selfcheck">Check the meaning and every part requested, not identical wording. How well did you recall it?</p><div className="practice-start"><button className="secondary" onClick={()=>rate('again')}><RotateCcw size={15}/>Needs practice</button><button className="primary" onClick={()=>rate('known')}><Check size={15}/>Got it</button></div></div>}
  </article></div>}
  {review&&!question&&<div className="practice-complete" role="status"><Check size={30}/><h2>Practice set complete</h2><p>You marked {review.queue.length-missed} as recalled and {missed} for another look. These are self-checks, not quiz marks.</p><div className="practice-start">{missed>0&&<button className="secondary" onClick={()=>{save(key,retryQuiz1(review));resetFace();setNotice('');}}>Review {missed} again</button>}<button className="primary" disabled={!available} onClick={start}>Start another set</button></div></div>}
  <p className="practice-disclaimer">This slide-only revision starts fresh practice sets. Older reading-based and MCQ progress stays saved separately and will not appear here. Typed practice answers are not saved or sent to AI.</p>
 </section>;
}
