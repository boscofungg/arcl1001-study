import corpus from './corpus.json' with { type: 'json' };
import documents from './documents.json' with { type: 'json' };
import { getPageVisual } from './material-visuals.ts';
import type { VisualImage } from './media-types.ts';

export type Passage = { id: string; docId: string; page: number; text: string; box?:number[]|null };
export type Source = Passage & { title: string; kind: string; week: number; label: string; images?: VisualImage[]; visualRepresentation?: string; supplementalText?: string; url?:string; isSummary?:boolean };
const docs = new Map(documents.map(d => [d.id, d]));
// Slide text is split into positioned blocks; keep the title and its evidence together.
const lecturePages = new Map<string, Passage[]>();
for (const chunk of corpus) if (docs.get(chunk.docId)?.kind === 'Lecture') {
  const key = `${chunk.docId}-${chunk.page}`;
  lecturePages.set(key, [...(lecturePages.get(key) || []), chunk]);
}
const searchable: Passage[] = [
  ...corpus.filter(chunk => docs.get(chunk.docId)?.kind !== 'Lecture'),
  ...[...lecturePages.values()].map(chunks => ({id: `${chunks[0].docId}-p${chunks[0].page}-visual`, docId: chunks[0].docId, page: chunks[0].page, text: mergePageText(chunks), box: null})),
];
const stop = new Set('a an the and or of for to in on is are was were be been with from by this that it as at what how why when where which who explain describe compare about can could would should me you i my we our course content please give tell some more does do did than between their they them into also using use ask practice question questions knowledge test quiz help understand summarize summary remember revision review study'.split(' '));
export function retrieve(query: string, week = 0, docId?: string, count = 7): Source[] {
  const terms = [...new Set(query.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])].filter(t => !stop.has(t)).slice(0,24);
  if (!terms.length) return [];
  const aliases: Record<string,string[]> = {urbanization:['urbanization','urbanisation','urbanism','urban','city','cities','uruk'],city:['city','cities','urban'],cities:['city','cities','urban']};
  const groups=terms.map(t=>aliases[t]||[t]);
  const candidates=searchable.flatMap(chunk=>{
    const doc=docs.get(chunk.docId)!;
    if((week&&doc.week!==week)||(docId&&doc.id!==docId))return [];
    if(/add locator map|quiz.*cover|quiz instructions|alternative table|to be added/i.test(chunk.text))return [];
    const words=chunk.text.replace(/https?:\/\/\S+/gi,'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
    const counts=groups.map(group=>words.filter(w=>group.includes(w)).length);
    if(!counts.some(Boolean))return [];
    return [{chunk,doc,counts,length:words.length}];
  });
  const frequencies=groups.map((_,i)=>candidates.filter(c=>c.counts[i]>0).length);
  const total=corpus.length;
  const scored=candidates.map(c=>{
    const hits=c.counts.filter(Boolean).length;
    let score=c.counts.reduce((sum,n,i)=>sum+(n?Math.log(1+(total-frequencies[i]+.5)/(frequencies[i]+.5))*(n*2.2)/(n+1.2*(.25+.75*c.length/180)):0),0);
    score*=hits/Math.min(groups.length,3);
    if(c.doc.kind==='Lecture')score*=1.5;
    if(c.chunk.text.length<65)score*=.6;
    return {...c,score};
  }).sort((a,b)=>b.score-a.score);
  const seen = new Set<string>(), perDoc = new Map<string,number>();
  const results: Source[]=[];
  const add=(item:typeof scored[number])=>{
    const {chunk,doc}=item;
    const key=`${doc.id}-${chunk.page}`;
    if(seen.has(key)||(perDoc.get(doc.id)||0)>=4)return;
    seen.add(key);perDoc.set(doc.id,(perDoc.get(doc.id)||0)+1);
    const visual=getPageVisual(doc.id,chunk.page);
    const web=doc as {url?:string;isSummary?:boolean};
    results.push({...chunk,title:doc.title,kind:doc.kind,week:doc.week,label:`${doc.kind==='Lecture'?'Slide':doc.kind==='Web'?'Reading summary':'Page'} ${chunk.page}`,images:visual?.images,visualRepresentation:visual?.representation,supplementalText:visual?.text,...web.url?{url:web.url,isSummary:true}:{}});
  };
  // Explicit comparisons must retrieve evidence for each named place, even within one lecture.
  const entities=[/uruk/i,/mohenjo[ -]?daro/i,/harappa(?!n)/i,/erlitou/i,/yinxu|anyang/i,/g[oö]bekli/i,/saqqara|djoser/i,/giza/i,/dmanisi/i,/fu\s+hao/i,/tikal/i,/tel[l]?[ -]?abada/i];
  const named=entities.filter(entity=>entity.test(query));
  if(named.length>1)for(const entity of named){const item=scored.find(item=>entity.test(item.chunk.text));if(item)add(item);}
  for(const item of scored){if(results.length>=count)break;add(item);}

  return results;
}
export function mergePageText(passages: Passage[]): string {
  return passages.reduce((text, p) => {
    if (!text) return p.text;
    const overlap = p.text.slice(0, 200);
    return text.endsWith(overlap) ? text + p.text.slice(200) : text + '\n\n' + p.text;
  }, '');
}
export function getPageSource(docId: string, page: number): Source | null {
  const doc=docs.get(docId);
  if(!doc || !Number.isInteger(page) || page<1 || page>doc.pages) return null;
  const passages=corpus.filter(c=>c.docId===docId && c.page===page);
  const visual=getPageVisual(docId,page);
  return {id:passages[0]?.id || `${docId}-p${page}-visual`,docId,page,
    text:mergePageText(passages),title:doc.title,kind:doc.kind,week:doc.week,
    label:`${doc.kind==='Lecture'?'Slide':'Page'} ${page}`,
    images:visual?.images || [],visualRepresentation:visual?.representation,supplementalText:visual?.text,...(doc as {url?:string}).url?{url:(doc as {url?:string}).url,isSummary:true}:{}};
}
export function getSource(id: string) {
  const passage = corpus.find(c=>c.id===id);
  if(passage) return {...passage,document:docs.get(passage.docId),visual:getPageVisual(passage.docId,passage.page)};
  const match=/^(d\d+)-p(\d+)-visual$/.exec(id);
  const source=match ? getPageSource(match[1],Number(match[2])) : null;
  return source ? {...source,document:docs.get(source.docId),visual:getPageVisual(source.docId,source.page)} : null;
}
export function getDocumentPages(docId: string) {
  return corpus.filter(c=>c.docId===docId);
}
