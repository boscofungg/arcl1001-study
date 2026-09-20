
'use client';
import Image from 'next/image';
import {useState,useSyncExternalStore,useEffect,useRef,type CSSProperties} from 'react';
import {ArrowRight,BookOpen,Check,RotateCcw,Sparkles} from 'lucide-react';
import {questionBank,newProgress,parseProgress,recordGradedAttempt,markEvidenceChecked,getCorrectQuestionCount,getMissedQuestionIds,getComebackCount,getLatestAttempt,getPracticePool,selectPracticeQuestions} from '@/lib/expedition';
import type {Progress,PracticeScope} from '@/lib/expedition';
import documents from '@/lib/documents.json';
import {gradeAnswer} from '@/lib/graded-questions';
import './quiz1-practice.css';

// Keep the former Expeditions key so graded answers and in-progress sets survive.
const KEY='stratum-private-field-journal-v2';
type Session={queue:string[];index:number;missionId:string;attemptId:string};
type Stored={progress:Progress;session:Session|null};
let memory='';let storageUnavailable=false;
const listeners=new Set<()=>void>();
function subscribe(fn:()=>void){listeners.add(fn);window.addEventListener('storage',fn);return()=>{listeners.delete(fn);window.removeEventListener('storage',fn);};}
function snapshot(){try{return memory||localStorage.getItem(KEY)||'';}catch{return memory;}}
const serverSnapshot=()=>'';
function decode(raw:string):Stored{
 try{const data=JSON.parse(raw),s=data.session;
 const valid=s&&Array.isArray(s.queue)&&s.queue.length>0&&s.queue.length<=questionBank.length&&s.queue.every((id:unknown)=>questionBank.some(q=>q.id===id))&&new Set(s.queue).size===s.queue.length&&Number.isInteger(s.index)&&s.index>=0&&s.index<=s.queue.length&&typeof s.attemptId==='string'&&typeof s.missionId==='string';
 return {progress:parseProgress(JSON.stringify(data.progress)),session:valid?s:null};
 }catch{return {progress:newProgress(),session:null};}
}
function persist(data:Stored){const raw=JSON.stringify(data);try{localStorage.setItem(KEY,raw);memory='';storageUnavailable=false;}catch{memory=raw;storageUnavailable=true;}listeners.forEach(fn=>fn());}
const kindLabels={image:'Image identification',map:'Map question','short-answer':'Course concept',comparison:'Comparison'};
export default function Quiz1Practice({onOpen}:{onOpen:(docId:string,page:number,quote?:string)=>void}){
 const raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot),store=decode(raw),progress=store.progress,session=store.session;
 const [filters,setFilters]=useState<PracticeScope>({lecture:0,format:'mixed',kind:'mixed'});
 const [count,setCount]=useState<5|10>(5),[draft,setDraft]=useState(''),[evidenceOpen,setEvidenceOpen]=useState(false),[resetConfirm,setResetConfirm]=useState(false),[imageError,setImageError]=useState('');
 const feedbackHeading=useRef<HTMLDivElement>(null),questionTop=useRef<HTMLDivElement>(null);
 const question=session?questionBank.find(q=>q.id===session.queue[session.index]):undefined;
 const attempt=session?progress.attempts.find(a=>a.id===session.attemptId):undefined;
 const result=question&&attempt?gradeAnswer(question,attempt.response||''):null;
 const correct=Boolean(attempt&&!attempt.skipped&&result?.correct);
 const comeback=Boolean(correct&&question&&progress.attempts.some(a=>a.id!==attempt?.id&&a.questionId===question.id&&a.rating==='again'));
 const correctCount=getCorrectQuestionCount(progress),missed=getMissedQuestionIds(progress),comebacks=getComebackCount(progress),pool=getPracticePool(filters);
 const attemptId=attempt?.id,face=session?.attemptId;
 useEffect(()=>{if(face)questionTop.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});},[face]);
 useEffect(()=>{if(attemptId)feedbackHeading.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});},[attemptId]);
 function resetFace(){setDraft('');setEvidenceOpen(false);setImageError('');}
 function begin(queue:string[]){if(!queue.length)return;resetFace();persist({...store,session:{queue,index:0,missionId:'practice',attemptId:crypto.randomUUID()}});}
 function submitAnswer(skipped=false){if(!session||!question||attempt||imageError===question.id)return;persist({...store,progress:recordGradedAttempt(progress,question.id,skipped?'':draft,skipped,session.attemptId,new Date().toISOString())});}
 function nextQuestion(){if(!session||!attempt)return;persist({...store,session:{...session,index:session.index+1,attemptId:crypto.randomUUID()}});resetFace();}
 function exportProgress(){const file=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),...store},null,2)],{type:'application/json'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download='quiz1-practice-progress.json';a.click();URL.revokeObjectURL(url);}
 return <section className="quiz1-practice" aria-labelledby="quiz1-practice-title">
  <div className="section-kicker">RECALL · CHECK · REVIEW</div><h1 id="quiz1-practice-title">Quiz 1 practice</h1>
  <p className="practice-intro">{questionBank.length} questions from Lectures 1–3. Try MCQs and short blanks, check the evidence, and revisit what needs another look.</p>
  <p className="practice-disclaimer">Unofficial practice (beta). Short answers accept common equivalent wording and spelling variants. Your existing graded progress is kept.</p>
  <div className="practice-stats"><div><strong>{correctCount}<small> / {questionBank.length}</small></strong><span>Correct on latest try</span></div><div><strong>{missed.length}</strong><span>Need another look</span></div><div><strong>{comebacks}</strong><span>Successful retries</span></div></div>
  <form className="practice-controls" onSubmit={event=>{event.preventDefault();begin(selectPracticeQuestions(progress,{...filters,count}));}}>
   <label>Lecture<select aria-label="Lecture" value={filters.lecture} onChange={e=>setFilters({...filters,lecture:Number(e.target.value) as PracticeScope['lecture']})}><option value={0}>All lectures</option>{[1,2,3].map(n=><option key={n} value={n}>Lecture {n}</option>)}</select></label>
   <label>Question format<select aria-label="Question format" value={filters.format} onChange={e=>setFilters({...filters,format:e.target.value as PracticeScope['format']})}><option value="mixed">MCQs + short blanks</option><option value="mcq">MCQs only</option><option value="blank">Short blanks only</option></select></label>
   <label>Focus<select aria-label="Focus" value={filters.kind} onChange={e=>setFilters({...filters,kind:e.target.value as PracticeScope['kind']})}><option value="mixed">All question types</option>{Object.entries(kindLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <label>Set size<select aria-label="Set size" value={count} onChange={e=>setCount(Number(e.target.value) as 5|10)}><option value={5}>5 questions</option><option value={10}>10 questions</option></select></label>
   <div className="practice-start"><button className="primary" type="submit" disabled={!pool.length}>Start {Math.min(count,pool.length)}-question set<ArrowRight size={15}/></button>{missed.length>0&&<button type="button" className="secondary" onClick={()=>begin(missed)}><RotateCcw size={15}/>Review {missed.length} missed</button>}</div>
   <p>{pool.length?`${pool.length} matching questions · Unseen questions first.`:'No questions match these filters. Try another format or focus.'} Filters apply to new sets; starting one replaces the current set.</p>
  </form>
  {storageUnavailable&&<p className="practice-warning" role="status">Browser storage is unavailable. Export your progress before closing this session.</p>}
  {!session&&<div className="practice-empty"><h2>Answer first, then check.</h2><p>Choose a set above. Feedback explains each answer and links to the relevant course source. You can pause and return to a saved set.</p></div>}
  {session&&question&&<div className="practice-session" ref={questionTop}><div className="practice-position"><span>{kindLabels[question.kind]}</span><span>Question {session.index+1} of {session.queue.length}</span></div><progress aria-label="Practice progress" value={session.index+(attempt?1:0)} max={session.queue.length}/>
    <article className={`question-card ${attempt?correct?'graded-correct':'graded-attempted':''}`} key={session.attemptId}><span className="question-kind">{kindLabels[question.kind]} · {question.format==='mcq'?'Multiple choice':'Fill in the blank'}</span><h2>{question.prompt}</h2>
     {question.image&&<figure>{imageError===question.id?<p role="alert">Image unavailable. Pause this set and reload before answering.</p>:<Image unoptimized src={question.image.src} alt={question.kind==='map'?'Map with a marked location to identify':'Course image to identify'} width={question.image.width} height={question.image.height} onError={()=>setImageError(question.id)}/>}</figure>}
     <form onSubmit={event=>{event.preventDefault();submitAnswer();}}>
      {question.format==='mcq'?<fieldset className="mcq-options" disabled={Boolean(attempt)}><legend>Choose one answer</legend>{question.options?.map((option,index)=>{const chosen=(attempt?.response??draft)===option.id;const isAnswer=Boolean(attempt&&option.id===question.correctOptionId);return <label className={`mcq-option ${chosen?'selected':''} ${isAnswer?'option-correct':attempt&&chosen?'option-incorrect':''}`} key={option.id}><input type="radio" name="answer" value={option.id} checked={chosen} onChange={()=>setDraft(option.id)}/><span className="option-letter">{String.fromCharCode(65+index)}</span><span>{option.text}{isAnswer&&<small>Correct answer</small>}{attempt&&chosen&&!isAnswer&&<small>Your choice · try the review again later</small>}</span>{isAnswer&&<Check size={18}/>}</label>;})}</fieldset>:<label className="answer-input blank-input">Your answer <span>A word or short phrase. Equivalent wording and common spelling variants are accepted.</span><input type="text" autoComplete="off" maxLength={160} value={attempt?.response??draft} disabled={Boolean(attempt)} onChange={e=>setDraft(e.target.value)} placeholder="Fill the blank…"/></label>}
      {!attempt&&<div className="recall-actions"><button className="primary" type="submit" disabled={!draft.trim()||imageError===question.id}>Check my answer<ArrowRight size={16}/></button><button className="text-button" type="button" disabled={imageError===question.id} onClick={()=>submitAnswer(true)}>I don’t know yet</button></div>}
     </form>
     {attempt&&<div className={`answer-reveal grading-feedback ${correct?'feedback-correct':'feedback-retry'}`}>
      <div className="feedback-celebration" aria-hidden="true">{correct?Array.from({length:10},(_,i)=><i key={i} style={{'--particle':i} as CSSProperties}/>):null}</div>
      <div className="grade-heading" role="status" ref={feedbackHeading}><span className="grade-icon">{correct?<Check size={25}/>:<RotateCcw size={23}/>}</span><div><span className="attempt-stamp">ATTEMPT RECORDED</span><h3>{correct?comeback?'A comeback! Correct answer.':'Correct — nice work!':attempt.skipped?'A starting point for next time.':'Not quite yet — keep exploring.'}</h3><p>{attempt.skipped?'This question is saved for review. Read the explanation, then come back for a fresh attempt.':correct?'Your response matches the course answer.':'This question is saved for another try. Check the explanation below.'}</p>{correct&&question.format==='blank'&&result?.matchedVariant&&<span className="accepted-wording">Your wording was accepted.</span>}</div></div>
      <div className="answer-explanation"><h4>{question.format==='mcq'?'Why this answer fits':'Expected answer'}</h4>{question.format==='blank'&&<p className="canonical-answer">{question.answer}</p>}<p>{question.explanation}</p></div>
      {question.format==='blank'&&<details className="accepted-details"><summary>Examples of accepted wording</summary><p>{question.acceptedAnswers?.slice(0,8).join(' · ')}</p><small>Short answers are checked against course-specific alternatives, with limited typo tolerance. If an equivalent phrase is missed, note it for the beta feedback.</small></details>}
      <button className="evidence-button" aria-expanded={evidenceOpen} onClick={()=>setEvidenceOpen(!evidenceOpen)}><BookOpen size={16}/>{evidenceOpen?'Hide source evidence':'Inspect the source evidence'}</button>
      {evidenceOpen&&<div className="evidence-panel">{[question.source,...question.additionalSources||[]].map((source,index)=><section key={`${source.docId}-${source.page}`}><h4>{source.title} · {source.label}</h4><blockquote>{index===0?question.evidence:source.evidence}</blockquote><a href={documents.find(doc=>doc.id===source.docId)?.url||`/materials/${source.docId}/page-${source.page}.webp`} target="_blank" rel="noreferrer">{documents.find(doc=>doc.id===source.docId)?.kind==='Web'?'Open original reading ↗':'Open original page ↗'}</a><button className="source-tutor-link" onClick={()=>onOpen(source.docId,source.page,index===0?question.evidence:source.evidence)}>Read cited page <ArrowRight size={12}/></button></section>)}<label className="check-evidence"><input type="checkbox" checked={attempt.evidenceChecked} onChange={e=>persist({...store,progress:markEvidenceChecked(progress,attempt.id,e.target.checked)})}/>I checked my answer against the cited evidence.</label></div>}
      <div className="next-answer"><span>{correct?<><Sparkles size={14}/> {comeback?'A missed idea, recovered.':'One more idea recalled.'}</>:'A fresh attempt is waiting in your review queue.'}</span><button className="primary" onClick={nextQuestion}>{session.index+1===session.queue.length?'Finish set':'Next question'}<ArrowRight size={16}/></button></div>
     </div>}

    </article>
  </div>}
  {session&&!question&&<div className="practice-complete" role="status"><Check size={32}/><h2>Practice set complete</h2><p>You attempted {session.queue.length} questions. {session.queue.filter(id=>getLatestAttempt(progress,id)?.rating==='again').length} need another look. These are practice results, not official quiz marks.</p><div className="practice-start">{missed.length>0&&<button className="secondary" onClick={()=>begin(missed)}>Review {missed.length} missed</button>}<button className="primary" disabled={!pool.length} onClick={()=>begin(selectPracticeQuestions(progress,{...filters,count}))}>Start another set<ArrowRight size={15}/></button></div></div>}
  <details className="practice-data"><summary>Saved progress and answers</summary><p>Your submitted answers are marked and saved in this browser. They are not sent to AI and do not sync across devices. Earlier self-check sets are kept separately and are not treated as automatically correct.</p><div className="practice-start"><button className="secondary" onClick={exportProgress}>Export progress</button><button className="text-button" onClick={()=>setResetConfirm(true)}>Reset graded progress</button></div>{resetConfirm&&<div className="practice-warning" role="alert"><p>Clear saved graded answers and the current set? Export first if you want to keep a record.</p><button className="secondary" onClick={()=>{persist({progress:newProgress(),session:null});resetFace();setResetConfirm(false);}}>Yes, clear graded progress</button><button className="text-button" onClick={()=>setResetConfirm(false)}>Keep my progress</button></div>}</details>
 </section>;
}
