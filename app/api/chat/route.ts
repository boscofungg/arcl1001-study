import {tutorConfigured,requestTutor,readTutorText,streamTutorText,type TutorMessage,type TutorPart} from '@/lib/tutor-provider';
import { tutorSources } from '@/lib/tutor-sources';
import { getPageSource } from '@/lib/retrieval';
import documents from '@/lib/documents.json';
import { buildVisualContext } from '@/lib/visual-context';
import { encodeChatEvent, type ChatEvent } from '@/lib/chat-events';
import { sameOriginError, clientKey, allowRequest, type RateWindow } from '@/lib/request-guard';
import { logServerError } from '@/lib/server-log';
import { tutorSystemPrompt } from '@/lib/tutor-prompt';
import { retrievalQuery } from '@/lib/followup';
import { courseScopes, isQuizScope } from '@/lib/course-scopes';
export const runtime = 'nodejs';
export const maxDuration = 60;
const recent: RateWindow = new Map();
export async function POST(request: Request) {
  const originError=sameOriginError(request);
  if(originError) return Response.json({error:originError==='invalid'?'Invalid request origin.':'Please ask from the study page.'},{status:403});
  if(!allowRequest(recent,clientKey(request),12)) return Response.json({error:'Please wait a minute before asking another question.'},{status:429,headers:{'Retry-After':'60'}});
  let body;
  try { const raw=await request.text(); if(raw.length>40000) throw Error(); body=JSON.parse(raw); if(!body || typeof body!=="object" || Array.isArray(body)) throw Error(); } catch { return Response.json({error:'Please send a shorter question.'},{status:400}); }
  const {question, week = 0, docId, page, stream = false, history=[], courseScope}=body;
  if(typeof question!=='string' || !question.trim() || question.length>2000 || !Number.isInteger(week) || week<0 || (week!==0&&!documents.some(doc=>doc.week===week)) || (docId && !documents.some(d=>d.id===docId&&(!week||d.week===week))) || !Array.isArray(history) || history.length>8 || history.some((h: {role?:string;text?:string})=>!h || !['user','assistant'].includes(h.role||'') || typeof h.text!=='string' || h.text.length>4000)) return Response.json({error:'Please enter a question of up to 2,000 characters.'},{status:400});
  if(courseScope!==undefined&&!isQuizScope(courseScope))return Response.json({error:'Invalid course scope.'},{status:400});
  const scopeWeeks=isQuizScope(courseScope)?courseScopes[courseScope].weeks!:undefined;
  if(scopeWeeks&&((week&&!scopeWeeks.includes(week))||(docId&&!documents.some(d=>d.id===docId&&scopeWeeks.includes(d.week)))))return Response.json({error:`Choose a ${courseScopes[courseScope as 'quiz2'].label} source.`},{status:400});
  if(typeof stream!=='boolean') return Response.json({error:'Invalid streaming option.'},{status:400});
  if(page!==undefined && (!Number.isInteger(page) || !docId || !getPageSource(docId,page))) return Response.json({error:'Please choose a valid course page.'},{status:400});
  const sources=tutorSources(retrievalQuery(question,history),week,docId,page,scopeWeeks);
  if(!sources.length) return Response.json({answer:'I couldn’t find supporting text in the selected materials. Try naming a site, culture, or concept, or broaden the course scope.',sources:[]});
  if(!tutorConfigured()) return Response.json({error:'The tutor is not configured yet. You can still browse and read the course materials.',sources},{status:503});
  const context=sources.map((s,i)=>`[${i+1}] ${s.title} | ${s.label}\n${s.text.slice(0,12000)||'No readable text was extracted. Use the attached original visual if available.'}${s.supplementalText?'\nNative chart/table data:\n'+s.supplementalText:''}`).join('\n\n');
  const cancelled=new AbortController();
  const signal=AbortSignal.any([request.signal,cancelled.signal,AbortSignal.timeout(55000)]);
  async function generate(emit:(event:ChatEvent)=>void) {
    emit({type:'metadata',sources});
    emit({type:'status',message:'Reading the source visuals…'});
    const visualContext=await buildVisualContext(sources,signal);
    emit({type:'metadata',sources,reviewedSources:visualContext.reviewedSources,visualsUsed:visualContext.visualsUsed,visualWarning:visualContext.failedVisuals?'Some original visuals could not be loaded; the answer may rely on text for those sources.':undefined});
    emit({type:'status',message:'Preparing your answer…'});
    const parts:TutorPart[]=visualContext.parts.map(part=>'text' in part?{text:part.text}:{image:{format:'webp',source:{bytes:part.inlineData.data}}});
    const messages:TutorMessage[]=[...history.slice(-6).map((h:{role:'user'|'assistant';text:string})=>({role:h.role,content:[{text:h.text}]})),{role:'user',content:[{text:`SCOPE: ${docId ? `Only ${documents.find(d=>d.id===docId)!.title}. Do not use other readings or prior conversation as factual evidence. These are retrieved excerpts, not necessarily the complete document.` : `Selected Lecture ${week||(scopeWeeks?`${scopeWeeks[0]}–${scopeWeeks.at(-1)}`:'1–11')} materials.`}\nCOURSE EXCERPTS:\n${context}\n\nVisuals attached for sources: ${visualContext.reviewedSources.join(', ')||'none'}. Failed visual loads: ${visualContext.failedVisuals}.\n\nSTUDENT QUESTION:\n${question}`},...parts]}];
    const result=await requestTutor({system:tutorSystemPrompt,messages,maxTokens:1800,stream,signal});
    const finished=stream?await streamTutorText(result,text=>emit({type:'delta',text})):await readTutorText(result);
    if(!stream&&'text' in finished&&typeof finished.text==='string')emit({type:'delta',text:finished.text});
    if(finished.stopReason==='max_tokens')emit({type:'delta',text:'\n\nThis response reached its length limit. Ask a narrower follow-up to continue.'});
    else if(!['end_turn','stop_sequence'].includes(finished.stopReason))throw new Error('The tutor service stopped this answer early. Try rephrasing your question.');
    emit({type:'done'});
  }
  const errorMessage=(error:unknown)=>{logServerError('chat',error,{aborted:signal.aborted,stream});return signal.aborted?'The response was interrupted or timed out. Please try again.':error instanceof Error && !/JSON|Unexpected|fetch|network/i.test(error.message)?error.message:'The connection to the tutor was interrupted. Please try again.';};
  if(!stream){
    let answer='';let metadata:Extract<ChatEvent,{type:'metadata'}>={type:'metadata',sources};
    try {
      await generate(event=>{if(event.type==='delta')answer+=event.text;else if(event.type==='metadata')metadata=event;});
      return Response.json({answer,sources:metadata.sources,visualsUsed:metadata.visualsUsed,visualWarning:metadata.visualWarning,reviewedSources:metadata.reviewedSources});
    }catch(error){return Response.json({error:errorMessage(error),sources},{status:signal.aborted?504:502});}
  }
  const bodyStream=new ReadableStream<Uint8Array>({
    async start(controller){
      const emit=(event:ChatEvent)=>{if(!cancelled.signal.aborted)controller.enqueue(encodeChatEvent(event));};
      try {await generate(emit);}catch(error){emit({type:'error',message:errorMessage(error)});}
      finally {if(!cancelled.signal.aborted)controller.close();}
    },
    cancel(){cancelled.abort();}
  });
  return new Response(bodyStream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'}});
}
