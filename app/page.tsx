'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, FileText, Layers, MessageSquare, Search, Send, Sparkles, Square, X } from 'lucide-react';
import Link from 'next/link';
import documents from '@/lib/documents.json';
import { weeks } from '@/lib/course';
import type { Source } from '@/lib/retrieval';
import ThemeToggle from '@/components/theme-toggle';
import MaterialReader from '@/components/material-reader';
import type { PageContext } from '@/lib/media-types';
import { parseSSE } from '@/lib/sse';
import type { ChatEvent } from '@/lib/chat-events';

type Doc = typeof documents[number];
type Message = {id?:string;incomplete?:boolean;notice?:string;role:'user'|'assistant';text:string;sources?:Source[];error?:boolean;visualsUsed?:number;visualWarning?:string};
let reviewFallback = '[]';
function saveReview(next:number[]){reviewFallback=JSON.stringify(next);try{localStorage.setItem('stratum-reviewed',reviewFallback);}catch{}window.dispatchEvent(new Event('stratum-review'));}
function reviewSnapshot(){try{return localStorage.getItem('stratum-reviewed')||reviewFallback;}catch{return reviewFallback;}}
function subscribeReview(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener('stratum-review',callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener('stratum-review',callback);};}
export default function Home() {
 const [week,setWeek]=useState(2), [view,setView]=useState<'learn'|'library'>('learn');
 const [query,setQuery]=useState(''), [scope,setScope]=useState('all'), [draft,setDraft]=useState('');
 const [messages,setMessages]=useState<Message[]>([]), [busy,setBusy]=useState(false);
 const [replyStatus,setReplyStatus]=useState('Finding evidence in your materials…');
 const activeRequest=useRef<AbortController|null>(null);
 const [reader,setReader]=useState<{document:Doc;initialPage:number}|null>(null);
 const [pageContext,setPageContext]=useState<PageContext|null>(null);
 const [mobileChat,setMobileChat]=useState(false);
 const end=useRef<HTMLDivElement>(null), input=useRef<HTMLTextAreaElement>(null);
 const reviewRaw=useSyncExternalStore(subscribeReview,reviewSnapshot,()=> '[]');
 let reviewed:number[]=[];try{const parsed=JSON.parse(reviewRaw);if(Array.isArray(parsed))reviewed=parsed.filter((n:unknown)=>typeof n==='number'&&weeks.some(w=>w.n===n));}catch{}
 const unit=weeks.find(w=>w.n===week)!;
 const weeklyDocs=documents.filter(d=>d.week===week);
 const lecture=weeklyDocs.find(d=>d.kind==='Lecture');
 const filtered=(view==='library'?documents:weeklyDocs).filter(d=>(d.title+' '+d.kind).toLowerCase().includes(query.toLowerCase()));
 useEffect(()=>{end.current?.scrollIntoView({behavior:busy?'auto':'smooth',block:'nearest'});},[messages,busy]);
 useEffect(()=>()=>activeRequest.current?.abort(),[]);
 function toggleReviewed(){const next=reviewed.includes(week)?reviewed.filter(w=>w!==week):[...reviewed,week];saveReview(next);}
 function openDoc(doc:Doc,page:number|null=null){setReader({document:doc,initialPage:page||1});}
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
     const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream'},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(65000)]),body:JSON.stringify({question:q,stream:true,week:scope==='week'?week:0,...(pageContext||{}),history})});
     if(!response.headers.get('content-type')?.includes('text/event-stream')){
       const data=await response.json() as {error?:string;answer:string;sources?:Source[];visualsUsed?:number;visualWarning?:string};
       if(data.error)throw new Error(data.error);
       if(!response.ok||!data.answer)throw new Error('The tutor could not return an answer. Please try again.');
       text=data.answer;finished=true;update({text,sources:data.sources,visualsUsed:data.visualsUsed,visualWarning:data.visualWarning,incomplete:false});
     }else{
       if(!response.body)throw new Error('No response stream was received. Please try again.');
       for await(const frame of parseSSE(response.body)){
         const event=JSON.parse(frame.data) as ChatEvent;
         if(event.type==='status')setReplyStatus(event.message);
         else if(event.type==='metadata')update({sources:event.sources,visualsUsed:event.visualsUsed,visualWarning:event.visualWarning});
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
  try{Promise.resolve(context.registerTool({name:'open_course_week',description:'Open a supplied ARCL1001 week in the course browser.',inputSchema:{type:'object',properties:{week:{type:'integer',enum:[2,3,4,5,6,7]}},required:['week'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(value:unknown)=>{const n=(value as {week?:number})?.week;if(!weeks.some(w=>w.n===n))throw Error('Choose a supplied week from 2 to 7');setWeek(n!);setView('learn');setQuery('');return{week:n,topic:weeks.find(w=>w.n===n)!.topic};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}return()=>lifecycle.abort();
 },[]);
 function renderText(text:string,sources:Source[]=[]){return text.split(/(\[\d+(?:\s*,\s*\d+)*\])/g).map((part,i)=>{const match=part.match(/^\[([\d,\s]+)\]$/);if(!match)return <span key={i}>{part.replace(/\*\*/g,'')}</span>;return match[1].split(',').map((number,j)=>{const source=sources[Number(number.trim())-1];return source?<button className="citation" key={`${i}-${j}`} onClick={()=>openDoc(documents.find(d=>d.id===source.docId)!,source.page)} aria-label={`Read source ${number.trim()}, ${source.label}`}>{number.trim()}</button>:<span key={`${i}-${j}`}>[{number.trim()}]</span>;});});}
 return <div className="shell">
  <aside className="sidebar">
   <Link className="brand" href="/" aria-label="Stratum home"><span className="brandmark"><Layers size={23}/></span><span>stratum<span className="branddot">.</span></span></Link>
   <div className="course-label">YOUR COURSE</div><div className="course-name">ARCL1001 <span>2026</span></div><p className="course-sub">Archaeology Around<br/>the Globe</p>
   <nav aria-label="Study navigation"><button className={view==='learn'?'nav-item active':'nav-item'} onClick={()=>{setView('learn');setQuery('');}}><BookOpen size={18}/> Study workspace</button><button className={view==='library'?'nav-item active':'nav-item'} onClick={()=>{setView('library');setQuery('');}}><Layers size={18}/> Course library <span>{documents.length}</span></button></nav>
   <div className="course-label week-label">LECTURE WEEKS <span>02—07</span></div>
   <div className="week-list">{weeks.map(w=><button key={w.n} className={week===w.n&&view==='learn'?'week-item selected':'week-item'} onClick={()=>{setWeek(w.n);setView('learn');setQuery('');}}><span className="week-number">{String(w.n).padStart(2,'0')}</span><span>{w.topic}</span>{reviewed.includes(w.n)?<Check size={14}/>:week===w.n&&view==='learn'?<span className="selected-dot"/>:null}</button>)}</div>
   <div className="sidebar-bottom"><div className="progress-label"><span>Your review progress</span><b>{reviewed.length}/6</b></div><div className="progress-track"><span style={{width:`${reviewed.length/6*100}%`}}/></div><p>Saved on this device</p><div className="student"><span>✦</span><div>A little curiosity, every day.<small>Your archaeology field notes</small></div></div></div>
  </aside>
  <div className="workspace">
   <header className="topbar"><div>ARCL1001 <ChevronRight size={13}/> <span>{view==='library'?'Course library':`Week ${String(week).padStart(2,'0')}`}</span></div><div className="topbar-right"><ThemeToggle/><span className="status-dot"/> Course materials connected<button className="mobile-tutor-button" onClick={()=>setMobileChat(true)}><MessageSquare size={16}/> Tutor</button></div></header>
   <div className="work-columns">
    <main className="study-pane">
     <div className="section-kicker">{view==='library'?'YOUR REFERENCE SHELF':`WEEK ${String(week).padStart(2,'0')} / ${unit.region.toUpperCase()}`}</div>
     <h1>{view==='library'?'The course library':unit.title}</h1><p className="intro">{view==='library'?'Lecture slides, readings, and research. Open a source to explore its original visuals alongside the text.':unit.intro}</p>
     {view==='learn'&&<><div className="unit-meta"><span><FileText size={14}/>{weeklyDocs.length} materials</span><span>{unit.sites}</span></div>
     <section className="lecture-card"><div className="lecture-art" aria-hidden="true"><div className="contour c1"/><div className="contour c2"/><div className="contour c3"/><div className="contour c4"/><span className="artifact-number">{String(week).padStart(2,'0')}</span><span className="art-caption">FIELD NOTES / ARCL1001</span></div><div className="lecture-content"><span className="eyebrow">THE LECTURE</span><h2>{unit.topic}</h2><p>{lecture?.pages} slides · Original visuals + text</p><button className="primary-button" onClick={()=>lecture&&openDoc(lecture)}>Open lecture <ArrowRight size={16}/></button></div></section>
     <div className="section-heading"><h2>Think like an archaeologist</h2><span>GUIDED REVIEW</span></div><div className="prompt-grid">{unit.prompts.map((p,i)=><button className="prompt-card" key={p} onClick={()=>{setPageContext(null);setScope('week');setDraft(p);setMobileChat(true);input.current?.focus();}}><span className="prompt-index">0{i+1} <ArrowRight size={15}/></span><span>{p}</span><small>Explore with your tutor</small></button>)}</div></>}
     <div className="section-heading materials-heading"><h2>{view==='library'?'All materials':'Course materials'}</h2><span>{view==='library'?documents.length:weeklyDocs.length} SOURCES</span></div>
     <label className="search-box"><Search size={16}/><input aria-label="Search course materials" placeholder="Find a reading or lecture…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Clear search" onClick={()=>setQuery('')}><X size={14}/></button>}</label>
     <div className="material-list">{filtered.length?filtered.map(d=><button className="material-row" key={d.id} onClick={()=>openDoc(d)}><span className={`file-icon ${d.kind==='Lecture'?'slides':''}`}><FileText size={19}/></span><span className="material-title">{d.title}<small>{d.kind} · {d.week?`Week ${d.week} · `:''}{d.pages} {d.kind==='Lecture'?'slides':'pages'}{d.indexedPages<d.pages?' · Partial text coverage':''}</small></span><ChevronRight size={16}/></button>):<p className="empty">No materials match “{query}”. Try a site or author name.</p>}</div>
     {view==='learn'&&<div className="review-footer"><span>Finished revisiting this week?</span><button className={reviewed.includes(week)?'review-button done':'review-button'} onClick={toggleReviewed}><Check size={15}/>{reviewed.includes(week)?'Reviewed':'Mark as reviewed'}</button></div>}
     <p className="coverage-note">Includes supplied materials for Weeks 2–7 and the syllabus. Original page previews preserve figures and layout. AI visual interpretations should be checked against the source. Weeks 1 and 8–12 are awaiting materials.</p>
    </main>
    <aside className={`tutor-pane ${mobileChat?'mobile-open':''}`} aria-label="Course tutor"><div className="tutor-header"><span className="tutor-icon"><Sparkles size={19}/></span><div><h2>Your study companion</h2><p>Grounded in your course materials</p></div><button className="close-mobile" aria-label="Close tutor" onClick={()=>setMobileChat(false)}><X size={19}/></button></div>
     <div className="scope-row"><BookOpen size={14}/><select aria-label="Tutor source scope" value={pageContext?'page':scope} disabled={busy||!!pageContext} onChange={e=>setScope(e.target.value)}>{pageContext&&<option value="page">Selected page {pageContext.page}</option>}<option value="all">All course materials</option><option value="week">Week {week} materials</option></select><span className="scope-badge">CITED</span></div>
     <div className="conversation" role="log" aria-live="polite">{!messages.length?<div className="tutor-welcome"><div className="welcome-symbol"><Sparkles size={28}/></div><h3>Start with a question.</h3><p>Untangle a concept, connect ideas, or test what you remember. We’ll go back to the evidence together.</p><div className="starter-questions">{['What makes Uruk a city?','Compare Mohenjo-daro and Erlitou.','Ask me a practice question about urbanization.'].map((p,i)=><button key={p} onClick={()=>ask(p)}><span>{['Understand a concept','Connect two ideas','Test your knowledge'][i]}<small>{p}</small></span><ArrowRight size={15}/></button>)}</div><div className="citation-hint"><span>1</span> Answers link back to the source.<br/>You can always check the evidence.</div></div>:messages.map((m,i)=><div className={`message ${m.role} ${m.error?'error':''}`} key={i}><span className="message-label">{m.role==='user'?'YOU':'STRATUM'}</span><div className="message-text">{renderText(m.text,m.sources)}</div>{m.notice&&<p className="response-notice" role="status">{m.notice}</p>}{!!m.visualsUsed&&<p className="visual-evidence-note">Used {m.visualsUsed} original page visual{m.visualsUsed===1?'':'s'}</p>}{m.visualWarning&&<p className="visual-evidence-warning">{m.visualWarning}</p>}{!!m.sources?.length&&<details className="source-details"><summary>{m.error?'Related course passages': 'Retrieved sources'} · {m.sources.length}</summary>{m.sources.map((s,j)=><button key={s.id} onClick={()=>openDoc(documents.find(d=>d.id===s.docId)!,s.page)}><b>{j+1}</b><span>{s.title}<small>{s.label}</small></span></button>)}</details>}</div>)}{busy&&!messages[messages.length-1]?.text&&<div className="thinking" role="status"><span/><span/><span/> {replyStatus}</div>}<div ref={end}/></div>
     <div className="composer-wrap">{messages.length>0&&<button className="new-chat" disabled={busy} onClick={()=>{setMessages([]);setPageContext(null);}}>Start a new conversation</button>}{pageContext&&<div className="page-context-chip"><FileText size={14}/><span>{documents.find(d=>d.id===pageContext.docId)?.kind==='Lecture'?'Slide':'Page'} {pageContext.page} · {documents.find(d=>d.id===pageContext.docId)?.title}</span><button aria-label="Clear selected page" disabled={busy} onClick={()=>setPageContext(null)}><X size={14}/></button></div>}<form className="composer" onSubmit={e=>{e.preventDefault();void ask(draft);}}><textarea ref={input} aria-label="Ask the course tutor" placeholder="Ask about your course…" value={draft} maxLength={2000} disabled={busy} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void ask(draft);}}}/><div><span>Enter to send · Shift + Enter for a new line</span><button type={busy?'button':'submit'} aria-label={busy?'Stop response':'Send question'} title={busy?'Stop response':'Send question'} disabled={!busy&&!draft.trim()} onClick={busy?()=>activeRequest.current?.abort():undefined}>{busy?<Square size={15}/>:<Send size={16}/>}</button></div></form><p className="tutor-disclaimer">AI can make mistakes. Check the cited course sources.</p></div>
    </aside>
   </div>
  </div>
  {reader&&<MaterialReader key={`${reader.document.id}-${reader.initialPage}`} document={reader.document} initialPage={reader.initialPage} onClose={()=>setReader(null)} onAsk={page=>{setPageContext({docId:reader.document.id,page});setScope('all');setDraft(`Explain the images, diagrams, or graphs on this ${reader.document.kind==='Lecture'?'slide':'page'}. What evidence do they show, and how does it relate to the text?`);setReader(null);setMobileChat(true);input.current?.focus();}}/>}
 </div>;
}