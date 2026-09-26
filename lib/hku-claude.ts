import {parseBedrockStream} from './bedrock-stream.ts';
export type ClaudePart={text:string}|{image:{format:'webp'|'png'|'jpeg';source:{bytes:string}}};
export type ClaudeMessage={role:'user'|'assistant';content:ClaudePart[]};
export function claudeConfigured(){return Boolean(process.env.HKU_CLAUDE_KEY?.trim());}
export async function claudeRequest({system,messages,maxTokens,stream=false,signal}:{system:string;messages:ClaudeMessage[];maxTokens:number;stream?:boolean;signal:AbortSignal}):Promise<Response>{
 const key=process.env.HKU_CLAUDE_KEY?.trim();
 if(!key)throw new Error('The tutor is not configured. Please contact the site administrator.');
 const model=process.env.HKU_CLAUDE_MODEL?.trim()||'claude-haiku-4.5';
 if(!/^[a-zA-Z0-9.-]+$/.test(model))throw new Error('The configured AI model is invalid. Please contact the site administrator.');
 // HKU requires this query parameter; never log the URL or propagate fetch errors containing it.
 const url=new URL(`https://api.hku.hk/claude/student/model/${model}/${stream?'converse-stream':'converse'}`);
 url.searchParams.set('subscription-key',key);
 let response:Response;
 try{response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},redirect:'error',signal,body:JSON.stringify({system:[{text:system}],messages,inferenceConfig:{maxTokens,temperature:0.2}})});}catch{throw new Error(signal.aborted?'The AI request was interrupted or timed out. Please try again.':'Could not connect to the university AI service. Please try again.');}
 if(!response.ok){await response.body?.cancel();throw new Error(response.status===401||response.status===403?'The university AI service denied access. The site administrator needs to check its subscription key.':response.status===429?'The university AI service has reached its quota. Please try again later.':response.status===404?'The university AI model is unavailable. Please contact the site administrator.':response.status===400?'The university AI service could not accept this request. Please contact the site administrator.':'The university AI service is temporarily unavailable. Please try again.');}
 return response;
}
type ConverseData={output?:{message?:{content?:{text?:string}[]}};stopReason?:string};
export async function readClaudeText(response:Response):Promise<{text:string;stopReason:string}>{
 let data:ConverseData;try{data=await response.json();}catch{throw new Error('The university AI service returned an unreadable response. Please try again.');}
 const text=data.output?.message?.content?.flatMap(part=>typeof part.text==='string'?[part.text]:[]).join('')||'';
 if(!text.trim()||typeof data.stopReason!=='string')throw new Error('The university AI service returned an incomplete response. Please try again.');
 return {text,stopReason:data.stopReason};
}
export async function streamClaudeText(response:Response,onText:(text:string)=>void):Promise<{stopReason:string}>{
 if(!response.headers.get('content-type')?.includes('application/vnd.amazon.eventstream')){
  const result=await readClaudeText(response);onText(result.text);return {stopReason:result.stopReason};
 }
 if(!response.body)throw new Error('No AI response stream was received. Please try again.');
 let stopReason='',hasText=false;
 for await(const event of parseBedrockStream(response.body)){
  const data=event.data as {delta?:{text?:string};stopReason?:string};
  if(event.type==='contentBlockDelta'&&typeof data?.delta?.text==='string'){hasText=true;onText(data.delta.text);}
  if(event.type==='messageStop'&&typeof data?.stopReason==='string')stopReason=data.stopReason;
 }
 if(!hasText||!stopReason)throw new Error('The AI connection ended before the answer was complete. Please try again.');
 return {stopReason};
}
