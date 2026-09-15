import corpus from './corpus.json' with { type: 'json' };
import documents from './documents.json' with { type: 'json' };
import { getPageVisual } from './material-visuals.ts';
import type { VisualImage } from './media-types.ts';

export type Passage = { id: string; docId: string; page: number; text: string };
export type Source = Passage & { title: string; kind: string; week: number; label: string; images?: VisualImage[]; visualRepresentation?: string; supplementalText?: string };
const docs = new Map(documents.map(d => [d.id, d]));
const stop = new Set('a an the and or of for to in on is are was were be been with from by this that it as at what how why when where which who explain describe compare about can could would should me you i my we our course content please give tell some more does do did than between their they them into also using use ask practice question questions knowledge test quiz help understand summarize summary remember revision review study evidence archaeological archaeology'.split(' '));
export function retrieve(query: string, week = 0, docId?: string, count = 7): Source[] {
  const terms = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])].filter(t => !stop.has(t)).slice(0,24);
  if (!terms.length) return [];
  const aliases: Record<string,string[]> = {urbanization:['urbanization','urbanisation','urbanism','urban','city','cities','uruk'],city:['city','cities','urban','uruk'],cities:['city','cities','urban','uruk']};
  const groups=terms.map(t=>aliases[t]||[t]);
  const candidates=corpus.flatMap(chunk=>{
    const doc=docs.get(chunk.docId)!;
    if((week&&doc.week!==week)||(docId&&doc.id!==docId))return [];
    if(/add locator map|quiz.*cover|quiz instructions|alternative table|to be added/i.test(chunk.text))return [];
    const words=chunk.text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
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
    if(c.doc.kind==='Lecture')score*=1.8;
    return {...c,score};
  }).sort((a,b)=>b.score-a.score);
  const seen = new Set<string>(), perDoc = new Map<string,number>();
  const results: Source[]=[];
  for (const {chunk,doc} of scored) {
    const key = `${doc.id}-${chunk.page}`;
    if (seen.has(key) || (perDoc.get(doc.id)||0)>=3) continue;
    seen.add(key); perDoc.set(doc.id,(perDoc.get(doc.id)||0)+1);
    results.push({...chunk,title:doc.title,kind:doc.kind,week:doc.week,label:`${doc.kind === 'Lecture' ? 'Slide' : 'Page'} ${chunk.page}`,images:getPageVisual(doc.id,chunk.page)?.images,visualRepresentation:getPageVisual(doc.id,chunk.page)?.representation,supplementalText:getPageVisual(doc.id,chunk.page)?.text});
    if(results.length>=count) break;
  }
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
    images:visual?.images || [],visualRepresentation:visual?.representation,supplementalText:visual?.text};
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
