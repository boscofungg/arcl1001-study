'use client';
import {useEffect,useState} from 'react';
import {Download} from 'lucide-react';
import {studySheet,studyCsv,type StudyExportItem} from '@/lib/study-export';
export default function StudyDownload({title,filename,items}:{title:string;filename:string;items:StudyExportItem[]}){
 const [ready,setReady]=useState<{url:string;name:string}|null>(null);
 useEffect(()=>()=>{if(ready)URL.revokeObjectURL(ready.url);},[ready]);
 const [answers,setAnswers]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function download(format:'html'|'csv'){
  if(busy)return;setBusy(true);setError('');
  try{
   const images:Record<string,string>={};let total=0;
   if(format==='html')for(const src of new Set(items.flatMap(q=>q.image?[q.image.src]:[]))){
    if(!/^\/(?:materials|quiz1)\/[a-zA-Z0-9/_-]+\.(?:webp|png|jpg|jpeg)$/.test(src))throw Error('An image could not be included. Please try again.');
    const r=await fetch(src,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('An image could not download. Please retry when connected.');
    const blob=await r.blob();total+=blob.size;if(total>20000000||!/^image\/(webp|png|jpeg)$/.test(blob.type))throw Error('The image export is too large or unavailable. Try a smaller set.');
    images[src]=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Could not prepare an image.'));reader.readAsDataURL(blob);});
   }
   const content=format==='html'?studySheet(title,items,images,answers):studyCsv(items,answers);
   const url=URL.createObjectURL(new Blob([content],{type:format==='html'?'text/html;charset=utf-8':'text/csv;charset=utf-8'}));
   const link=document.createElement('a');link.href=url;link.download=`${filename}${answers?'':'-questions-only'}.${format}`;setReady({url,name:link.download});link.click();
  }catch(e){setError(e instanceof Error?e.message:'Download failed. Please try again.');}finally{setBusy(false);}
 }
 return <details className="study-download"><summary><Download size={16}/> Download this set</summary><label><input type="checkbox" checked={answers} onChange={e=>setAnswers(e.target.checked)} disabled={busy}/> Include model answer key</label><div><button type="button" disabled={busy||!items.length} onClick={()=>download('html')}>{busy?'Preparing…':'Download study sheet'}</button><button type="button" disabled={busy||!items.length} onClick={()=>download('csv')}>Download CSV</button></div><p>Study sheet: offline questions, images and a separate answer key. Open it in a browser to print or save as PDF. CSV: spreadsheet text with online image links. Your written responses are not included.</p>{ready&&<p role="status">Your file is ready. <a href={ready.url} download={ready.name}>Save file</a></p>}{error&&<p role="alert">{error}</p>}</details>;
}
