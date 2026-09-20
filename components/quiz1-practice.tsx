'use client';
import Image from 'next/image';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {ArrowRight,BookOpen,Check,RotateCcw} from 'lucide-react';
import documents from '@/lib/documents.json';
import {slideQuestions,getSlidePracticePool} from '@/lib/slide-practice';
import {quiz1KindLabels} from '@/lib/quiz1-practice';
import type {Quiz1Kind} from '@/lib/quiz1-types';
import {markSlideAnswer,slideRubrics} from '@/lib/slide-marking';
import {startMarkedSet,recordSlideResponse,advanceMarkedSet,retryMarkedSet,parseMarkedSet,markedSetTotals} from '@/lib/marked-slide-review';
import type {MarkedSlideReview} from '@/lib/marked-slide-review';
import './quiz1-practice.css';
const temporary=new Map<string,string>();
const subscribe=(listener:()=>void)=>{window.addEventListener('storage',listener);window.addEventListener('slide-practice',listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener('slide-practice',listener);};};
function snapshot(key:string){try{return temporary.get(key)||localStorage.getItem(key)||'';}catch{return temporary.get(key)||'';}}
function save(key:string,value:MarkedSlideReview){const raw=JSON.stringify(value);try{localStorage.setItem(key,raw);temporary.delete(key);}catch{temporary.set(key,raw);}window.dispatchEvent(new Event('slide-practice'));}
const empty=()=>'';
export default function Quiz1Practice({lecture,onLectureChange,onOpen}:{lecture:number;onLectureChange:(lecture:number)=>void;onOpen:(docId:string,page:number,quote?:string)=>void}){
 const key=`quiz1-slide-marked-v2-L${lecture}`;
 const raw=useSyncExternalStore(subscribe,()=>snapshot(key),empty);
 const bank=getSlidePracticePool(lecture as 1|2|3),state=parseMarkedSet(raw,bank),review=state?.review;
 const slide=documents.find(doc=>doc.kind==='Lecture'&&doc.week===lecture)!;
 const [kind,setKind]=useState<Quiz1Kind|'mixed'>('mixed'),[count,setCount]=useState<5|10>(5),[draft,setDraft]=useState(''),[notice,setNotice]=useState(''),[imageError,setImageError]=useState('');
 const active=useRef<HTMLDivElement>(null),feedback=useRef<HTMLDivElement>(null);
 const question=review?bank.find(q=>q.id===review.queue[review.position]):undefined;
 const face=question&&review?`${review.startedAt}:${review.position}:${question.id}`:'';
 const response=question&&state?state.answers[question.id]:undefined;
 const mark=question&&response?.mode==='marked'?markSlideAnswer(question.id,response.text):null;
 const shown=Boolean(response),available=bank.filter(q=>kind==='mixed'||q.kind===kind).length;
 const revealedFace=shown?face:'';
 useEffect(()=>{if(revealedFace)feedback.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});},[revealedFace]);
 const totals=state?markedSetTotals(state):null;
 const missed=review?review.queue.filter(id=>review.ratings[id]==='again').length:0;
 useEffect(()=>{if(face)active.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});},[face]);
 function resetFace(){setDraft('');setImageError('');}
 function start(){if(!available)return;save(key,startMarkedSet(bank,kind,count));resetFace();setNotice('');}
 function submit(mode:'marked'|'revealed'){if(!state||!question||response||imageError===face)return;save(key,recordSlideResponse(state,draft,mode));setNotice('');}
 function next(){if(!state||!response)return;save(key,advanceMarkedSet(state));resetFace();setNotice(mark?.status==='correct'?'Correct answer recorded.':mark?.status==='partial'?'Partial credit recorded; saved for review.':'Saved for review.');}

 return <section className="quiz1-practice" aria-labelledby="quiz1-practice-title">
  <div className="section-kicker">QUIZ 1 · LECTURE SLIDES ONLY</div><h1 id="quiz1-practice-title">Quiz 1 practice</h1>
  <p className="practice-intro">Start with a lecture deck. Practise image identification, map labels and concise answers using only the slides.</p>
  <div className="slide-practice-tabs" role="group" aria-label="Practice lecture">{documents.filter(doc=>doc.kind==='Lecture').map(doc=><button key={doc.id} aria-pressed={lecture===doc.week} onClick={()=>onLectureChange(doc.week)}><strong>Lecture {doc.week}</strong><span>{doc.pages} slides</span></button>)}</div>
  <div className="slide-practice-heading"><div><h2>{slide.title}</h2><p>{bank.length} questions from this deck · {slideQuestions.length} slide-based questions in total</p></div><button className="secondary" onClick={()=>onOpen(slide.id,slide.startPage)}><BookOpen size={15}/>View lecture slides</button></div>
  <p className="practice-disclaimer">Practice follows the announced image, map and short-answer formats; it is not an official paper. Readings remain available in the chatbot, but are excluded here and from flashcards. Automatic practice marks recognise key ideas and approximate dates. They are not official exam marks; check the model answer if valid wording was not recognised.</p>
  <form className="practice-controls" onSubmit={event=>{event.preventDefault();start();}}><label>Question type<select aria-label="Question type" value={kind} onChange={e=>setKind(e.target.value as Quiz1Kind|'mixed')}><option value="mixed">Mixed quiz formats</option>{Object.entries(quiz1KindLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Set size<select aria-label="Set size" value={count} onChange={e=>setCount(Number(e.target.value) as 5|10)}><option value={5}>5 questions</option><option value={10}>10 questions</option></select></label><div className="practice-start"><button className="primary" disabled={!available}>Start {Math.min(count,available)}-question set<ArrowRight size={15}/></button>{missed>0&&state&&<button type="button" className="secondary" onClick={()=>{save(key,retryMarkedSet(state!));resetFace();setNotice('');}}><RotateCcw size={15}/>Review {missed} again</button>}</div><p>{available?`${available} matching questions. Starting a set replaces this lecture’s current set.`:'No questions of this type in this deck. Choose another type or lecture.'}</p></form>
  {notice&&<p className="slide-practice-notice" key={`${notice}-${review?.position}`} role="status"><Check size={15}/>{notice}</p>}
  {question&&review&&<div className="practice-session" ref={active}><div className="practice-position"><span>{quiz1KindLabels[question.kind]} · Lecture {lecture}</span><span>Question {review.position+1} of {review.queue.length}</span></div><progress aria-label="Practice progress" value={review.position+(shown?1:0)} max={review.queue.length}/><article className="question-card"><h2>{question.question}</h2>{question.image&&<figure>{imageError===face?<p role="alert">The image could not load. Reload before answering.</p>:<Image unoptimized src={question.image.src} width={question.image.width} height={question.image.height} alt={question.kind==='map'?'Map with a location to identify':'Lecture image to identify'} onError={()=>setImageError(face)}/>}</figure>}
   <label className="answer-input">Your answer<span>Include each requested part. Use BC/BCE for calendar dates, or years ago for ages; equivalent wording is accepted.</span><textarea aria-label="Your answer" rows={3} maxLength={2000} value={response?.text??draft} disabled={shown} onChange={e=>setDraft(e.target.value)} placeholder="Try answering from memory…"/></label>
   {!shown?<div className="recall-actions"><button className="primary" disabled={!draft.trim()||imageError===face} onClick={()=>submit('marked')}>Mark my answer<ArrowRight size={15}/></button><button className="text-button" disabled={imageError===face} onClick={()=>submit('revealed')}>Reveal model answer</button></div>:<div className={`answer-reveal slide-mark-feedback ${mark?.status==='correct'?'feedback-correct':mark?.status==='partial'?'feedback-partial':'feedback-retry'}`}>
    <div className="grade-heading" role="status" ref={feedback}><span className="grade-icon">{mark?.status==='correct'?<Check size={25}/>:<RotateCcw size={23}/>}</span><div><h3>{mark?mark.status==='correct'?'Correct':mark.status==='partial'?'Partly correct':'Needs review':'Model answer revealed'}</h3><p>{mark?`${mark.score} / ${mark.maxScore} practice points · ${mark.feedback}`:'Not marked. Read the model answer, then try again in a review set.'}</p></div></div>
    <div className="answer-explanation"><h3>Model answer</h3><p>{question.answer}</p></div>
    {mark&&<details className="slide-evidence" open={mark.status!=='correct'}><summary>How your answer was marked</summary><p>{slideRubrics.find(r=>r.questionId===question.id)?.requiredCount?`Any ${mark.maxScore} of these points are sufficient.`:'Each requested part receives one practice point.'}</p><ul className="mark-criteria">{mark.criteria.map(c=><li key={c.id}><span>{c.matched?'✓':'○'}</span><div>{c.label}{!c.matched&&c.feedback&&<small>{c.feedback}</small>}</div></li>)}</ul></details>}
    {slideRubrics.find(r=>r.questionId===question.id)?.criteria.some(c=>c.tolerance)&&<div className="mark-tolerances"><strong>Accepted numerical ranges for practice</strong><ul>{slideRubrics.find(r=>r.questionId===question.id)!.criteria.filter(c=>c.tolerance).map(c=><li key={c.id}>{c.tolerance}</li>)}</ul><small>These generous practice tolerances are not an official marking scheme. The model answer above retains the slide’s stated date.</small></div>}
    <details className="slide-evidence"><summary>Check the lecture-slide evidence</summary>{[question.source,...question.additionalSources||[]].map((source,index)=><section key={`${source.docId}-${source.page}-${index}`}><h4>{source.title} · {source.label}</h4><blockquote>{index===0?question.evidence:source.evidence}</blockquote><button className="evidence-button" onClick={()=>onOpen(source.docId,source.page,index===0?question.evidence:source.evidence)}>Read cited slide<BookOpen size={14}/></button></section>)}</details>
    <p className="practice-selfcheck">Meaning matters more than identical wording. An unusual valid paraphrase may still need checking against the slide.</p><button className="primary" onClick={next}>{review.position+1===review.queue.length?'Finish set':'Next question'}<ArrowRight size={15}/></button>
   </div>}

  </article></div>}
  {review&&!question&&<div className="practice-complete" role="status"><Check size={30}/><h2>Practice set complete</h2><p>{totals?.attempted?`${totals.score} / ${totals.maxScore} practice points across ${totals.attempted} marked answers.`:'No answers were submitted for marking.'} {totals?.revealed||0} answers were revealed without marking. {missed} questions are saved for review. These are not official quiz marks.</p><div className="practice-start">{missed>0&&<button className="secondary" onClick={()=>{save(key,retryMarkedSet(state!));resetFace();setNotice('');}}>Review {missed} again</button>}<button className="primary" disabled={!available} onClick={start}>Start another set</button></div></div>}
  <p className="practice-disclaimer">Marked slide practice uses a separate saved set from earlier self-checks. Submitted responses and results stay in this browser and are not sent to AI. Older sets remain saved separately.</p>
 </section>;
}
