import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Source } from './retrieval';

type ImagePart = {text:string} | {inlineData:{mimeType:string;data:string}};
const maxImageBytes=1500000;

async function loadPreview(src:string): Promise<Buffer> {
  // Image paths originate in the checked-in manifest, never in a user-supplied URL.
  if(!/^\/materials\/d\d+\/[a-zA-Z0-9._-]+\.webp$/.test(src))throw new Error('Unsupported source image');
  if(process.env.VERCEL){
    const hostname=process.env.VERCEL_PROJECT_PRODUCTION_URL || 'arcl1001-study-boscofungg.vercel.app';
    if(!/^[a-zA-Z0-9.-]+$/.test(hostname))throw new Error('Invalid asset host');
    const response=await fetch(`https://${hostname}${src}`,{signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw new Error('Image unavailable');
    const length=Number(response.headers.get('content-length')||0);
    if(length>maxImageBytes)throw new Error('Image too large');
    const buffer=Buffer.from(await response.arrayBuffer());
    if(buffer.length>maxImageBytes)throw new Error('Image too large');
    return buffer;
  }
  const buffer=await readFile(join(process.cwd(),'public',src.slice(1)));
  if(buffer.length>maxImageBytes)throw new Error('Image too large');
  return buffer;
}
export async function buildVisualContext(sources:Source[]) {
  const candidates=sources.flatMap((source,index)=>(source.images||[]).slice(0,2).map(image=>({source,index,image}))).slice(0,4);
  const loaded=await Promise.all(candidates.map(async candidate=>{
    try{return {...candidate,buffer:await loadPreview(candidate.image.src)};}catch{return {...candidate,buffer:null};}
  }));
  const parts:ImagePart[]=[];
  const reviewedSources:number[]=[];
  for(const {source,index,image,buffer} of loaded){
    if(!buffer)continue;
    parts.push({text:`ORIGINAL VISUAL FOR SOURCE [${index+1}]: ${source.title}, ${source.label}. ${source.visualRepresentation==='slide-images'?'This is one embedded image, not the complete slide.':'This is a rendered original page or slide.'} ${image.alt}`});
    parts.push({inlineData:{mimeType:'image/webp',data:buffer.toString('base64')}});
    if(!reviewedSources.includes(index+1))reviewedSources.push(index+1);
  }
  return {parts,visualsUsed:loaded.filter(item=>item.buffer).length,reviewedSources,failedVisuals:loaded.filter(item=>!item.buffer).length};
}
