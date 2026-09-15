'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Expand } from 'lucide-react';
import type { Source } from '@/lib/retrieval';
import { referencedVisuals } from '@/lib/referenced-visuals';

export default function AnswerVisuals({text,sources,reviewedSources,onOpen}:{text:string;sources:Source[];reviewedSources?:number[];onOpen:(source:Source)=>void}){
  const [failed,setFailed]=useState<string[]>([]);
  const visuals=referencedVisuals(text,sources,reviewedSources);
  if(!visuals.length)return null;
  return <section className="answer-visuals" aria-label="Images referenced in this answer"><h3>Referenced visuals</h3>{visuals.map(({citation,source,image})=><figure key={image.src} className="answer-figure"><button className="answer-image-button" aria-label={`Open image from source ${citation}, ${source.label}`} onClick={()=>onOpen(source)}>{failed.includes(image.src)?<span className="answer-image-fallback">Preview unavailable. Open the source page.</span>:<Image unoptimized src={image.src} alt={image.alt||`${source.title}, ${source.label}`} width={image.width} height={image.height} onError={()=>setFailed(old=>[...old,image.src])}/>}<span className="answer-image-expand"><Expand size={13}/> Open source</span></button><figcaption><button className="answer-figure-citation" onClick={()=>onOpen(source)}><b>[{citation}]</b> {source.label} · {source.title}</button><span>Original course page · figures shown in context</span></figcaption></figure>)}</section>;
}
