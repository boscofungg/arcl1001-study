'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImageIcon, MessageSquare, PanelLeft, FileText, X, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import type { VisualPage } from '@/lib/media-types';

type DocumentInfo = {id:string;title:string;pages:number;kind:string};
type PageData = {page:number;text:string;visual:(VisualPage & {representation:string})|null};
export default function MaterialReader({document:doc,initialPage,onClose,onAsk}:{document:DocumentInfo;initialPage:number;onClose:()=>void;onAsk:(page:number)=>void}) {
  const [page,setPage]=useState(initialPage);
  const [mode,setMode]=useState<'visual'|'split'|'text'>('split');
  const [zoom,setZoom]=useState(1);
  const [result,setResult]=useState<{page:number;data?:PageData;error?:string}|null>(null);
  const [retry,setRetry]=useState(0);
  const [imageErrors,setImageErrors]=useState<string[]>([]);
  const dialog=useRef<HTMLDialogElement>(null);
  const scroller=useRef<HTMLDivElement>(null);
  const loaded=result?.page===page;
  const data=loaded?result?.data:undefined;
  const label=doc.kind==='Lecture'?'Slide':'Page';
  useEffect(()=>{const element=dialog.current;const focused=document.activeElement as HTMLElement|null;element?.showModal();return()=>{element?.close();focused?.focus();};},[]);
  useEffect(()=>{
    const controller=new AbortController();
    fetch(`/api/source?doc=${encodeURIComponent(doc.id)}&page=${page}`,{signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error();return await response.json() as PageData;})
      .then(value=>{setResult({page,data:value});scroller.current?.scrollTo({top:0,left:0});})
      .catch(()=>{if(!controller.signal.aborted)setResult({page,error:'This page could not be loaded. Please try again.'});});
    return()=>controller.abort();
  },[doc.id,page,retry]);
  function navigate(value:number){if(Number.isInteger(value)&&value>=1&&value<=doc.pages){setPage(value);setZoom(1);}}
  const images=data?.visual?.images||[];
  return <dialog className="material-dialog" ref={dialog} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-labelledby="reader-title">
    <div className="material-reader">
      <header className="material-reader-header"><div><span className="eyebrow">ORIGINAL COURSE MATERIAL</span><h2 id="reader-title">{doc.title}</h2></div><button autoFocus aria-label="Close material" onClick={onClose}><X size={23}/></button></header>
      <div className="reader-controls">
        <div className="page-navigation"><button aria-label="Previous page" disabled={page<=1} onClick={()=>navigate(page-1)}><ArrowLeft size={17}/></button><form key={page} onSubmit={e=>{e.preventDefault();navigate(Number(new FormData(e.currentTarget).get('page')));}}><label>{label} <input name="page" aria-label={`Go to ${label.toLowerCase()}`} type="number" min={1} max={doc.pages} defaultValue={page}/></label><span>of {doc.pages}</span><button type="submit">Go</button></form><button aria-label="Next page" disabled={page>=doc.pages} onClick={()=>navigate(page+1)}><ArrowRight size={17}/></button></div>
        <div className="reader-view-modes" role="group" aria-label="Reader view"><button aria-pressed={mode==='visual'} onClick={()=>setMode('visual')}><ImageIcon size={15}/> Visual</button><button aria-pressed={mode==='split'} onClick={()=>setMode('split')}><PanelLeft size={15}/> Both</button><button aria-pressed={mode==='text'} onClick={()=>setMode('text')}><FileText size={15}/> Text</button></div>
      </div>
      <div ref={scroller} className={`material-reader-content mode-${mode}`} aria-busy={!loaded}>
        {!loaded?<div className="reader-loading" role="status">Opening {label.toLowerCase()} {page}…</div>:result?.error?<div className="reader-loading" role="alert"><p>{result.error}</p><button className="primary-button" onClick={()=>setRetry(value=>value+1)}>Try again</button></div>:<>
          {mode!=='text'&&<section className="original-visuals" aria-label="Original page visuals"><div className="visual-section-heading"><div><h3>{data?.visual?.representation==='slide-images'?'Images from this slide':'Original '+label.toLowerCase()}</h3><p>{data?.visual?.representation==='slide-images'?'Original embedded images; the slide layout is not reproduced.':'Rendered from the supplied course file. No AI-generated imagery.'}</p></div><div className="zoom-controls"><button aria-label="Zoom out" disabled={zoom<=1} onClick={()=>setZoom(value=>Math.max(1,value-.25))}><ZoomOut size={17}/></button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom in" disabled={zoom>=2.5} onClick={()=>setZoom(value=>Math.min(2.5,value+.25))}><ZoomIn size={17}/></button></div></div>
            {images.length?<div className="visual-scroll"><div style={{width:`${zoom*100}%`}} className="page-images">{images.map((image,i)=><figure key={image.src}>{imageErrors.includes(image.src)?<div className="image-error">This preview could not load. <a href={image.src} target="_blank" rel="noreferrer">Open the image directly</a>.</div>:<Image unoptimized src={image.src} alt={image.alt||`${doc.title}, ${label.toLowerCase()} ${page}, visual ${i+1}`} width={image.width} height={image.height} priority={i===0} onError={()=>setImageErrors(previous=>[...previous,image.src])}/>}<figcaption><span>{label} {page}{images.length>1?` · Visual ${i+1}`:''}</span><a href={image.src} target="_blank" rel="noreferrer">Open image <ExternalLink size={12}/></a></figcaption></figure>)}</div></div>:<div className="no-visual"><ImageIcon size={26}/><p>No visual preview is available for this page.</p><p>The extracted text is still available.</p></div>}
          </section>}
          {mode!=='visual'&&<section className="reader-extract" aria-label="Extracted page text"><h3>Extracted text</h3><p className="extract-explanation">Check the original visual for layout, labels, figures, and relationships.</p>{data?.text?<div className="page-extracted-text">{data.text}</div>:<p className="no-extracted-text">No readable text was extracted from this page. The original visual may contain text, photographs, or diagrams.</p>}{data?.visual?.text&&<details className="native-data"><summary>Chart and table data</summary><div className="page-extracted-text">{data.visual.text}</div></details>}</section>}
        </>}
      </div>
      <footer className="reader-footer"><p>Keep the visual and its context together.</p><button className="primary-button" disabled={!loaded||!!result?.error} onClick={()=>onAsk(page)}><MessageSquare size={16}/> Ask about this {label.toLowerCase()}</button></footer>
    </div>
  </dialog>;
}
