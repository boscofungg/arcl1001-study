import bank from '../content/mock-paper-bank.json' with {type:'json'};
export const mockBank=bank;
export type DatePair={a:{year:number;era:'BCE'|'CE'};b:{year:number;era:'BCE'|'CE'}};
export type MockPaper={version:1;id:number;images:string[];concept:string;significance:string;discussion:string;map:string[];dates:DatePair[];selected:string[];answers:Record<string,string>;points:Record<string,{x:number;y:number}>;submitted:boolean;createdAt:string};
export type MockLibrary={version:1;selected:number;papers:MockPaper[]};
const shuffle=<T,>(values:T[],random:()=>number)=>{const v=[...values];for(let i=v.length-1;i>0;i--){const j=Math.floor(Math.max(0,Math.min(.999999,random()))*(i+1));[v[i],v[j]]=[v[j],v[i]];}return v;};
export function createMockPaper(previous:MockPaper[]=[],random:()=>number=Math.random):MockPaper{
 const id=(previous.at(-1)?.id||0)+1;
 function pick<T extends {id:string}>(pool:T[],field:'images'|'concept'|'significance'|'discussion',count=1){const recent=previous.slice(-Math.max(1,Math.floor(pool.length/count)-1)).flatMap(p=>p[field]);const fresh=shuffle(pool.filter(q=>!recent.includes(q.id)),random);return [...fresh,...shuffle(pool.filter(q=>recent.includes(q.id)),random)].slice(0,count).map(q=>q.id);}
 const number=()=>25*(1+Math.floor(random()*40));
 let a=number(),b=number();if(a===b)b+=25;
 if(id%2===0)[a,b]=[b,a];
 const cross:DatePair={a:{year:number(),era:'BCE'},b:{year:number(),era:'CE'}};
 if(id%2===0)[cross.a,cross.b]=[cross.b,cross.a];
 return {version:1,id,images:pick(bank.images,'images',3),concept:pick(bank.concepts,'concept')[0],significance:pick(bank.significance,'significance')[0],discussion:pick(bank.discussions,'discussion')[0],map:id%2?['south-america','tigris','yellow-river']:['egypt','indus','mesopotamia'],dates:[{a:{year:a,era:'BCE'},b:{year:b,era:'BCE'}},cross],selected:[],answers:{},points:{},submitted:false,createdAt:new Date().toISOString()};
}
export function chronologyAnswer(pair:DatePair){const value=(d:DatePair['a'])=>d.era==='BCE'?1-d.year:d.year;return {recent:value(pair.a)>value(pair.b)?'a':'b',years:Math.abs(value(pair.a)-value(pair.b)),simpleYears:pair.a.era!==pair.b.era?pair.a.year+pair.b.year:Math.abs(pair.a.year-pair.b.year)};}
export function chronologyFeedback(pair:DatePair,recent:string,gap:string){const expected=chronologyAnswer(pair);const n=/^\d+$/.test(gap.trim())?Number(gap):NaN;return {recentCorrect:recent===expected.recent,gapCorrect:n===expected.years||n===expected.simpleYears,...expected};}
export function sentenceCount(text:string){return text.trim()?text.trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter(Boolean).length:0;}
export function parseMockLibrary(raw:string):MockLibrary{
 const empty:MockLibrary={version:1,selected:0,papers:[]};
 try{
  if(!raw||raw.length>3000000)return empty;const data=JSON.parse(raw);
  if(data.version!==1||!Array.isArray(data.papers)||data.papers.length>30)return empty;
  const validId=(pool:{id:string}[],id:unknown)=>typeof id==='string'&&pool.some(q=>q.id===id);
  for(const p of data.papers){
   if(p.version!==1||!Number.isSafeInteger(p.id)||p.id<1||typeof p.createdAt!=='string'||typeof p.submitted!=='boolean'||!Array.isArray(p.images)||p.images.length!==3||new Set(p.images).size!==3||p.images.some((id:unknown)=>!validId(bank.images,id))||!validId(bank.concepts,p.concept)||!validId(bank.significance,p.significance)||!validId(bank.discussions,p.discussion))return empty;
   if(!Array.isArray(p.selected)||p.selected.length>2||new Set(p.selected).size!==p.selected.length||p.selected.some((id:unknown)=>!p.images.includes(id))||!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers)||Object.values(p.answers).some(v=>typeof v!=='string'||v.length>6000))return empty;
   if(!Array.isArray(p.map)||p.map.length!==3||new Set(p.map).size!==3||p.map.some((id:string)=>!['south-america','tigris','yellow-river','egypt','indus','mesopotamia'].includes(id)))return empty;
   if(!p.points||typeof p.points!=='object'||Array.isArray(p.points)||Object.entries(p.points).some(([id,v])=>!p.map.includes(id)||!v||typeof v!=='object'||!Number.isFinite((v as {x:number}).x)||!Number.isFinite((v as {y:number}).y)||(v as {x:number}).x<0||(v as {x:number}).x>1||(v as {y:number}).y<0||(v as {y:number}).y>1))return empty;
   if(!Array.isArray(p.dates)||p.dates.length!==2||p.dates.some((d:DatePair)=>!d||[d.a,d.b].some(v=>!v||!['BCE','CE'].includes(v.era)||!Number.isInteger(v.year)||v.year<1||v.year>10000)||d.a.year===d.b.year&&d.a.era===d.b.era))return empty;
  }
  if(new Set(data.papers.map((p:MockPaper)=>p.id)).size!==data.papers.length)return empty;
  return {version:1,selected:data.papers.some((p:MockPaper)=>p.id===data.selected)?data.selected:data.papers.at(-1)?.id||0,papers:data.papers};
 }catch{return empty;}
}
