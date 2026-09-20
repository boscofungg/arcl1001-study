import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Source } from './retrieval';

type ImagePart = {text:string} | {inlineData:{mimeType:string;data:string}};
const maxImageBytes=1500000;

const previewCache=new Map<string,{buffer:Buffer;expires:number}>();
let cachedBytes=0;
const cacheBudget=16*1024*1024;
async function loadPreview(src:string, signal?:AbortSignal): Promise<Buffer> {
  // Image paths originate in the checked-in manifest, never in a user-supplied URL.
  if(!/^\/materials\/d\d+\/[a-zA-Z0-9._-]+\.webp$/.test(src))throw new Error('Unsupported source image');
  signal?.throwIfAborted();
  const cached=previewCache.get(src);
  if(cached && cached.expires>Date.now()) {
    previewCache.delete(src);previewCache.set(src,cached);
    return cached.buffer;
  }
  if(cached){cachedBytes-=cached.buffer.length;previewCache.delete(src);}
  const save=(buffer:Buffer)=>{
    const previous=previewCache.get(src);
    if(previous){cachedBytes-=previous.buffer.length;previewCache.delete(src);}
    while(cachedBytes+buffer.length>cacheBudget || previewCache.size>=32){
      const oldest=previewCache.keys().next().value;
      if(!oldest)break;
      cachedBytes-=previewCache.get(oldest)!.buffer.length;previewCache.delete(oldest);
    }
    previewCache.set(src,{buffer,expires:Date.now()+10*60*1000});cachedBytes+=buffer.length;
    return buffer;
  };
  // Originals are bundled with this function, including on Vercel. Protected beta
  // assets cannot be fetched anonymously through either deployment's public URL.
  const buffer=await readFile(join(process.cwd(),'public',src.slice(1)),{signal});
  if(buffer.length>maxImageBytes)throw new Error('Image too large');
  return save(buffer);
}
export async function buildVisualContext(sources:Source[], signal?:AbortSignal) {
  const candidates=sources.flatMap((source,index)=>(source.images||[]).slice(0,2).map(image=>({source,index,image}))).slice(0,4);
  const loaded=await Promise.all(candidates.map(async candidate=>{
    try{return {...candidate,buffer:await loadPreview(candidate.image.src,signal)};}catch{return {...candidate,buffer:null};}
  }));
  signal?.throwIfAborted();
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
