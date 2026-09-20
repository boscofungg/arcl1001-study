'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, BookOpen, Brain, ChevronRight, FileText, Layers, MessageSquare, Search, Send, Sparkles, Square, X } from 'lucide-react';
import Link from 'next/link';
import documents from '@/lib/documents.json';
import { weeks } from '@/lib/course';
import type { Source } from '@/lib/retrieval';
import Quiz1Practice from '@/components/quiz1-practice';
import type { SourceHighlight } from '@/lib/source-highlight';
import './quiz1.css';
import FlashcardStudy from '@/components/flashcard-study';
import ThemeToggle from '@/components/theme-toggle';
import AnswerVisuals from '@/components/answer-visuals';
import MaterialReader from '@/components/material-reader';
import type { PageContext } from '@/lib/media-types';
import { parseSSE } from '@/lib/sse';
import type { ChatEvent } from '@/lib/chat-events';

const subscribeReady=()=>()=>{};
const readySnapshot=()=>true;
const serverNotReady=()=>false;
type Doc = typeof documents[number];
type Message = {id?:string;incomplete?:boolean;notice?:string;role:'user'|'assistant';text:string;sources?:Source[];error?:boolean;visualsUsed?:number;visualWarning?:string;reviewedSources?:number[]};
export default function StudyWorkspace({initialContext,initialView='tutor'}:{initialContext?:PageContext;initialView?:'tutor'|'practice'}) {
 const ready=useSyncExternalStore(subscribeReady,readySnapshot,serverNotReady);
 const [week,setWeek]=useState(documents.find(doc=>doc.id===initialContext?.docId)?.week||1), [view,setView]=useState<'tutor'|'practice'|'flashcards'>(initialView);
 const [query,setQuery]=useState(''), [scope,setScope]=useState(initialContext?`doc:${initialContext.docId}`:'all'), [draft,setDraft]=useState(initialContext?'Explain the evidence on this page.':'');
 const [messages,setMessages]=useState<Message[]>([]), [busy,setBusy]=useState(false);
 const [replyStatus,setReplyStatus]=useState('Finding evidence in your materials…');
 const activeRequest=useRef<AbortController|null>(null);
 const [reader,setReader]=useState<{document:Doc;initialPage:number;highlight?:SourceHighlight}|null>(null);
 const [activeDocument,setActiveDocument]=useState<{id:string;page:number;highlight?:SourceHighlight}>(initialContext?{id:initialContext.docId,page:initialContext.page}:{id:documents[0].id,page:documents[0].startPage});
 const [lectureFilter,setLectureFilter]=useState(0);
 const [pageContext,setPageContext]=useState<PageContext|null>(initialContext||null);
 const [mobileChat,setMobileChat]=useState(Boolean(initialContext));
 const end=useRef<HTMLDivElement>(null), input=useRef<HTMLTextAreaElement>(null);
 const unit=weeks.find(w=>w.n===week)!;
 const selectedDoc=documents.find(doc=>doc.id===activeDocument.id)||documents[0];
 const scopedDocument=documents.find(doc=>scope===`doc:${doc.id}`);
 const filtered=documents.filter(doc=>view==='tutor'?(!lectureFilter||doc.week===lectureFilter)&&(doc.title+' '+doc.kind).toLowerCase().includes(query.toLowerCase()):doc.kind==='Lecture');
 useEffect(()=>{end.current?.scrollIntoView({behavior:busy?'auto':'smooth',block:'nearest'});},[messages,busy]);
 useEffect(()=>()=>activeRequest.current?.abort(),[]);
 function openDoc(doc:Doc,page:number|null=null,text?:string,box?:number[]|null){
   const target=page||doc.startPage||1;
   const highlight=text||box?{page:target,text,box,requestId:Math.max(activeDocument.highlight?.requestId||0,reader?.highlight?.requestId||0)+1}:undefined;
   if(view==='tutor')setActiveDocument({id:doc.id,page:target,highlight});
   else setReader({document:doc,initialPage:target,highlight});
 }
 function changeScope(next:string){
   if(activeRequest.current)return;
   if(next!==scope)setMessages([]);
   setScope(next);setPageContext(null);
   const doc=documents.find(item=>next===`doc:${item.id}`);
   if(doc){setActiveDocument({id:doc.id,page:doc.startPage});setWeek(doc.week);}
 }
 function chatAboutDocument(doc:Doc){
   if(activeRequest.current)return;
   changeScope(`doc:${doc.id}`);setReader(null);setView('tutor');setMobileChat(true);
   setActiveDocument({id:doc.id,page:doc.startPage});setDraft('');input.current?.focus();
 }
 function askAboutPage(doc:Doc,page:number){
   if(activeRequest.current)return;
   changeScope(`doc:${doc.id}`);setActiveDocument({id:doc.id,page});setPageContext({docId:doc.id,page});
   setDraft('Explain the evidence on this page briefly.');setReader(null);setView('tutor');setMobileChat(true);input.current?.focus();
 }
 async function ask(question:string){
   if(activeRequest.current||!question.trim())return;
   const controller=new AbortController();activeRequest.current=controller;
   const id=crypto.randomUUID(),q=question.trim();
   const history=messages.filter(m=>!m.error&&!m.incomplete&&m.text).slice(-6).map(m=>({role:m.role,text:m.text.slice(0,4000)}));
   setMobileChat(true);setDraft('');setBusy(true);setReplyStatus('Finding evidence in your materials…');
   setMessages(old=>[...old,{role:'user',text:q},{id,role:'assistant',text:'',incomplete:true}]);
   const update=(change:Partial<Message>)=>setMessages(old=>old.map(m=>m.id===id?{...m,...change}:m));
   let text='',finished=false;
   try{
     const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream'},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(65000)]),body:JSON.stringify({question:q,stream:true,week:scopedDocument?scopedDocument.week:scope==='all'?0:Number(scope),...(scopedDocument?{docId:scopedDocument.id}:{}),...(pageContext||{}),history})});
     if(!response.headers.get('content-type')?.includes('text/event-stream')){
       const data=await response.json() as {error?:string;answer:string;sources?:Source[];visualsUsed?:number;visualWarning?:string;reviewedSources?:number[]};
       if(data.error)throw new Error(data.error);
       if(!response.ok||!data.answer)throw new Error('The tutor could not return an answer. Please try again.');
       text=data.answer;finished=true;update({text,sources:data.sources,visualsUsed:data.visualsUsed,visualWarning:data.visualWarning,reviewedSources:data.reviewedSources,incomplete:false});
     }else{
       if(!response.body)throw new Error('No response stream was received. Please try again.');
       for await(const frame of parseSSE(response.body)){
         const event=JSON.parse(frame.data) as ChatEvent;
         if(event.type==='status')setReplyStatus(event.message);
         else if(event.type==='metadata')update({sources:event.sources,visualsUsed:event.visualsUsed,visualWarning:event.visualWarning,reviewedSources:event.reviewedSources});
         else if(event.type==='delta'){text+=event.text;update({text});}
         else if(event.type==='done'){finished=true;update({incomplete:false});}
         else if(event.type==='error')throw new Error(event.message);
       }
       if(!finished)throw new Error('The connection ended before the answer was complete. Please try again.');
     }
   }catch(error){
     const notice=controller.signal.aborted?'Response stopped.':error instanceof Error&&!/JSON|Unexpected|fetch|network/i.test(error.message)?error.message:'Could not finish receiving the response. Please try again.';
     update({text:text||notice,notice:text?notice:undefined,incomplete:true,error:!text});
   }finally{
     if(activeRequest.current===controller){activeRequest.current=null;setBusy(false);}
   }
 }

 useEffect(()=>{
  type Context={registerTool:(tool:unknown,options:{signal:AbortSignal})=>unknown};
  const context=(document as Document & {modelContext?:Context}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{Promise.resolve(context.registerTool({name:'open_course_week',description:'Open a supplied ARCL1001 week in the course browser.',inputSchema:{type:'object',properties:{week:{type:'integer',enum:[1,2,3]}},required:['week'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(value:unknown)=>{const n=(value as {week?:number})?.week;if(!weeks.some(w=>w.n===n))throw Error('Choose Lecture 1, 2 or 3');setWeek(n!);setLectureFilter(n!);setView('tutor');const doc=documents.find(d=>d.week===n&&d.kind==='Lecture')!;setActiveDocument({id:doc.id,page:doc.startPage});setQuery('');return{week:n,topic:weeks.find(w=>w.n===n)!.topic};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}return()=>lifecycle.abort();
 },[]);
 function renderText(text:string,sources:Source[]=[]){return text.split(/(\[\d+(?:\s*,\s*\d+)*\])/g).map((part,i)=>{const match=part.match(/^\[([\d,\s]+)\]$/);if(!match)return <span key={i}>{part.replace(/\*\*/g,'')}</span>;return match[1].split(',').map((number,j)=>{const source=sources[Number(number.trim())-1];return source?<button className="citation" key={`${i}-${j}`} onClick={()=>openDoc(documents.find(d=>d.id===source.docId)!,source.page,source.text,source.box)} aria-label={`Read source ${number.trim()}, ${source.label}`}>{number.trim()}</button>:<span key={`${i}-${j}`}>[{number.trim()}]</span>;});});}
 if(!ready)return <main className="beta-study-loading" role="status"><Layers size={28}/><h1>Preparing your study workspace…</h1><p>Loading your course materials and study features.</p></main>;
 return <div className="shell quiz1-shell">
  <aside className="sidebar quiz1-sidebar">
    <Link className="brand" href="/" aria-label="Stratum home"><span className="brandmark"><Layers size={23}/></span><span>stratum<span className="branddot">.</span></span></Link>
    <div className="q1-course-heading"><strong>ARCL1001</strong><span>Quiz 1 · Lectures 1–3</span></div>
    <nav aria-label="Study navigation"><button className={view==='tutor'?'nav-item active':'nav-item'} onClick={()=>setView('tutor')}><BookOpen size={18}/> Read & ask</button><button className={view==='practice'?'nav-item active':'nav-item'} onClick={()=>setView('practice')}><Brain size={18}/> Quiz 1 practice</button><button className={view==='flashcards'?'nav-item active':'nav-item'} onClick={()=>setView('flashcards')}><Sparkles size={18}/> Make flashcards</button></nav>
    <section className="q1-library" aria-label="Selected course materials"><div className="q1-library-heading">{view==='tutor'?'COURSE MATERIALS':'LECTURE SLIDES'} <span>{view==='tutor'?documents.length:3}</span></div>{view==='tutor'&&<><div className="q1-lecture-filter" role="group" aria-label="Filter materials by lecture">{[0,1,2,3].map(n=><button aria-pressed={lectureFilter===n} key={n} onClick={()=>{setLectureFilter(n);if(n)setWeek(n);}}>{n?`L${n}`:'All'}</button>)}</div><label className="search-box"><Search size={14}/><input aria-label="Find a course material" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a material…"/></label></>}<div className="q1-source-list">{filtered.map(doc=><button key={doc.id} className={(view==='tutor'?activeDocument.id===doc.id:week===doc.week)?'q1-source selected':'q1-source'} onClick={()=>{setWeek(doc.week);if(view==='tutor')setActiveDocument({id:doc.id,page:doc.startPage});}}><FileText size={16}/><span>{doc.title.replace(/^Lecture \d — /,'')}<small>L{doc.week} · {doc.kind==='Web'?'Web reading summary':doc.kind} · {doc.pages} {doc.kind==='Lecture'?'slides':'pages'}</small></span></button>)}{!filtered.length&&<p className="empty">No matching materials.</p>}</div></section>
    <p className="q1-sidebar-note"><strong>STRATUM (BETA)</strong><br/>Read, ask and review with Quiz 1 practice.<br/>Share feedback to help improve your revision.</p>
  </aside>
  <div className="workspace quiz1-workspace">
    <header className="topbar"><div><span>STRATUM (BETA)</span><ChevronRight size={13}/><strong>{view==='tutor'?'Read & ask':view==='practice'?'Practice':'Flashcards'}</strong></div><div className="topbar-right"><ThemeToggle/>{view==='tutor'&&<button className="mobile-tutor-button" onClick={()=>setMobileChat(true)}><MessageSquare size={16}/> Tutor</button>}</div></header>
    {view==='tutor'&&<label className="q1-mobile-source">Open material<select aria-label="Open course document" value={selectedDoc.id} onChange={e=>{const doc=documents.find(d=>d.id===e.target.value)!;setWeek(doc.week);setActiveDocument({id:doc.id,page:doc.startPage});}}>{documents.map(doc=><option value={doc.id} key={doc.id}>L{doc.week} · {doc.title}</option>)}</select></label>}
    <div className={view==='tutor'?'work-columns quiz1-tutor-grid':'quiz1-practice-workspace'}>
      <main className={view==='tutor'?'q1-document-pane':'study-pane q1-study-pane'}>{view==='tutor'?<><div className="q1-reading-chat"><button disabled={busy} onClick={()=>chatAboutDocument(selectedDoc)}><MessageSquare size={15}/> {selectedDoc.kind==='Lecture'?'Chat about this lecture document':'Chat about this reading'}</button><span>All pages in this document</span></div><MaterialReader key={selectedDoc.id} embedded document={selectedDoc} initialPage={activeDocument.page} highlight={activeDocument.highlight} onClose={()=>{}} onAsk={page=>askAboutPage(selectedDoc,page)}/></>:view==='practice'?<Quiz1Practice key={week} lecture={week} onLectureChange={setWeek} onOpen={(docId,page,quote)=>{const doc=documents.find(d=>d.id===docId);if(doc)openDoc(doc,page,quote);}}/>:<><div className="q1-flashcard-lectures" role="group" aria-label="Flashcard lecture">{weeks.map(w=><button key={w.n} aria-pressed={week===w.n} onClick={()=>setWeek(w.n)}>Lecture {w.n}</button>)}</div><FlashcardStudy key={week} week={week} topic={unit.topic} onOpen={(docId,page,quote)=>{const doc=documents.find(d=>d.id===docId);if(doc)openDoc(doc,page,quote);}}/></>}</main>
      {view==='tutor'&&(    <aside className={`tutor-pane ${mobileChat?'mobile-open':''}`} aria-label="Course tutor"><div className="tutor-header"><span className="tutor-icon"><Sparkles size={19}/></span><div><h2>Quiz 1 tutor</h2><p>Short answers · cited evidence · L1–3</p></div><button className="close-mobile" aria-label="Close tutor" onClick={()=>setMobileChat(false)}><X size={19}/></button></div>
     <div className="scope-row"><BookOpen size={14}/><select aria-label="Tutor source scope" value={scope} disabled={busy} onChange={e=>changeScope(e.target.value)}><option value="all">All Lecture 1–3 materials</option>{weeks.map(unit=><option key={unit.n} value={String(unit.n)}>Lecture {unit.n} only</option>)}{weeks.map(unit=><optgroup key={unit.n} label={`Lecture ${unit.n} documents`}>{documents.filter(doc=>doc.week===unit.n).map(doc=><option key={doc.id} value={`doc:${doc.id}`}>{doc.title.replace(/^Lecture \d — /,'')}{doc.kind==='Web'?' (summary)':''}</option>)}</optgroup>)}</select><span className="scope-badge">CITED</span></div>
     <p className="q1-scope-note">{scopedDocument?`Only: ${scopedDocument.title}. ${scopedDocument.kind==='Web'?'Uses the linked study summary; open the original for the full article.':'Searches across this document’s pages.'}`:'Choose a whole lecture or an individual document above.'} Changing scope starts a new conversation.</p><div className="conversation" role="log" aria-live="polite">{!messages.length?<div className="tutor-welcome"><h3>{scopedDocument?'Ask about this reading.':'Ask across the materials.'}</h3><p>{scopedDocument?'Ask for an explanation, a summary, or a short practice question. Answers use only this selected source.':'Compare places, periods and evidence from Lectures 1–3, or select an individual reading above.'}</p><div className="starter-questions">{(scopedDocument?['Summarize the main ideas in this reading.','Explain a key argument and its supporting evidence.','Which evidence supports the main claim in this reading?']:['Compare Uruk and Mohenjo-daro: give two differences supported by evidence.','Compare burial evidence at Harappa and Fu Hao’s tomb.','Why does the label Priest-King not prove a ruler existed?']).map(p=><button key={p} onClick={()=>ask(p)}><span>{p}</span><ArrowRight size={15}/></button>)}</div><button className="q1-practice-link" onClick={()=>setView('practice')}>Try image and map questions <ArrowRight size={15}/></button></div>:messages.map((m,i)=><div className={`message ${m.role} ${m.error?'error':''}`} key={i}><span className="message-label">{m.role==='user'?'YOU':'STRATUM'}</span><div className="message-text">{renderText(m.text,m.sources)}</div>{m.role==='assistant'&&!m.error&&<AnswerVisuals text={m.text} sources={m.sources||[]} reviewedSources={m.reviewedSources} onOpen={source=>openDoc(documents.find(d=>d.id===source.docId)!,source.page,source.text,source.box)}/>} {m.notice&&<p className="response-notice" role="status">{m.notice}</p>}{!!m.visualsUsed&&<p className="visual-evidence-note">Included {m.visualsUsed} original page visual{m.visualsUsed===1?'':'s'}</p>}{m.visualWarning&&<p className="visual-evidence-warning">{m.visualWarning}</p>}{!!m.sources?.length&&<details className="source-details"><summary>{m.error?'Related course passages': 'Retrieved sources'} · {m.sources.length}</summary>{m.sources.map((s,j)=><button key={s.id} onClick={()=>openDoc(documents.find(d=>d.id===s.docId)!,s.page,s.text,s.box)}><b>{j+1}</b><span>{s.title}<small>{s.label}</small></span></button>)}</details>}</div>)}{busy&&!messages[messages.length-1]?.text&&<div className="thinking" role="status"><span/><span/><span/> {replyStatus}</div>}<div ref={end}/></div>
     <div className="composer-wrap">{messages.length>0&&<button className="new-chat" disabled={busy} onClick={()=>{setMessages([]);setPageContext(null);}}>Start a new conversation</button>}{pageContext&&<div className="page-context-chip"><FileText size={14}/><span>{documents.find(d=>d.id===pageContext.docId)?.kind==='Lecture'?'Slide':'Page'} {pageContext.page} · {documents.find(d=>d.id===pageContext.docId)?.title}</span><button aria-label="Clear selected page" disabled={busy} onClick={()=>setPageContext(null)}><X size={14}/></button></div>}<form className="composer" onSubmit={e=>{e.preventDefault();void ask(draft);}}><textarea ref={input} aria-label="Ask the course tutor" placeholder="Ask a short Quiz 1 question…" value={draft} maxLength={2000} disabled={busy} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void ask(draft);}}}/><div><span>Enter to send · Shift + Enter for a new line</span><button type={busy?'button':'submit'} aria-label={busy?'Stop response':'Send question'} title={busy?'Stop response':'Send question'} disabled={!busy&&!draft.trim()} onClick={busy?()=>activeRequest.current?.abort():undefined}>{busy?<Square size={15}/>:<Send size={16}/>}</button></div></form><p className="tutor-disclaimer">AI can make mistakes. Check the cited course sources.</p></div>
    </aside>)}
    </div>
  </div>
  {reader&&<MaterialReader key={`${reader.document.id}-${reader.initialPage}`} document={reader.document} initialPage={reader.initialPage} highlight={reader.highlight} onClose={()=>setReader(null)} onAsk={page=>askAboutPage(reader.document,page)}/>}
 </div>;
}
