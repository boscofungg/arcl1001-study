import {parseMarkedSet,startMarkedSet} from './marked-slide-review.ts';
import type {MarkedSlideReview} from './marked-slide-review.ts';
import type {Quiz1Kind,Quiz1Question} from './quiz1-types.ts';
export type PracticeSet={id:number;label:string;state:MarkedSlideReview;wordings:Record<string,number>;images?:Record<string,number>};
export type PracticeLibrary={version:1;selected:number;nextId:number;sets:PracticeSet[]};
export function parsePracticeLibrary(raw:string,bank:Quiz1Question[],legacy=''):PracticeLibrary{
 const fallback=parseMarkedSet(legacy,bank);
 const empty:PracticeLibrary={version:1,selected:fallback?1:0,nextId:fallback?2:1,sets:fallback?[{id:1,label:'Set 1',state:fallback,wordings:{}}]:[]};
 try{
  if(!raw||raw.length>5000000)return empty;
  const value=JSON.parse(raw);
  if(value.version!==1||!Array.isArray(value.sets)||value.sets.length>100||!Number.isSafeInteger(value.nextId)||value.nextId<1)return empty;
  const sets:PracticeSet[]=value.sets.map((s:PracticeSet)=>{
   const state=parseMarkedSet(JSON.stringify(s.state),bank);
   if(!state||!Number.isSafeInteger(s.id)||s.id<1||s.id>=value.nextId||typeof s.label!=='string'||s.label.length>80)throw Error();
   const wordings:Record<string,number>={};
   for(const [id,n] of Object.entries(s.wordings||{}))if(state.review.queue.includes(id)&&Number.isInteger(n)&&n>=0&&n<20)wordings[id]=n;
   const images:Record<string,number>={};
   for(const [id,n] of Object.entries(s.images||{}))if(state.review.queue.includes(id)&&Number.isInteger(n)&&n>=0&&n<20)images[id]=n;
   return {id:s.id,label:s.label,state,wordings,...s.images?{images}:{}};
  });
  if(new Set(sets.map(s=>s.id)).size!==sets.length)return empty;
  return {version:1,selected:sets.some(s=>s.id===value.selected)?value.selected:(sets[0]?.id||0),nextId:value.nextId,sets};
 }catch{return empty;}
}
export function addPracticeSet(library:PracticeLibrary,bank:Quiz1Question[],kind:Quiz1Kind|'mixed',count:number,variants:Record<string,string[]>,random:()=>number=Math.random,imageVariants:Record<string,unknown[]>={}):PracticeLibrary{
 if(library.sets.length>=100)return library;
 const seenIds=[...new Set(library.sets.flatMap(s=>[...s.state.review.queue,...(s.state.seenIds||[])]))];
 const previous=library.sets.at(-1)?.state;
 const state=startMarkedSet(bank,kind,count,previous?{...previous,seenIds}:null,random);
 const wordings=Object.fromEntries(state.review.queue.map(id=>[id,Math.floor(Math.max(0,Math.min(.999999,random()))*((variants[id]?.length||0)+1))]));
 const images=Object.fromEntries(state.review.queue.map(id=>[id,Math.floor(Math.max(0,Math.min(.999999,random()))*((imageVariants[id]?.length||0)+1))]));
 const id=library.nextId;
 return {...library,selected:id,nextId:id+1,sets:[...library.sets,{id,label:`Set ${id}`,state,wordings,images}]};
}
export function updatePracticeSet(library:PracticeLibrary,state:MarkedSlideReview):PracticeLibrary{return {...library,sets:library.sets.map(s=>s.id===library.selected?{...s,state}:s)};}
export function addPracticeReview(library:PracticeLibrary,state:MarkedSlideReview):PracticeLibrary{
 if(library.sets.length>=100)return library;
 const parent=library.sets.find(s=>s.id===library.selected),id=library.nextId;
 return {...library,selected:id,nextId:id+1,sets:[...library.sets,{id,label:`Set ${id} · review of ${parent?.id}`,state,wordings:parent?.wordings||{},images:parent?.images||{}}]};
}
