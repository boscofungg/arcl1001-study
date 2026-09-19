import { retrieve, getPageSource, getDocumentPages } from './retrieval.ts';
import type { Source } from './retrieval.ts';

/** A document scope is a hard boundary, including when a page is focused. */
export function tutorSources(query:string, week=0, docId?:string, page?:number):Source[] {
  const focused=docId && page!==undefined ? getPageSource(docId,page) : null;
  let found=retrieve(query,week,docId);
  // Whole-reading prompts often contain no topic keywords. Sample indexed pages
  // across that document, never borrow evidence from a different reading.
  if(docId && (!found.length || /\b(summari[sz]e|overview|main (ideas|arguments|points)|key (ideas|arguments|points))\b/i.test(query))) {
    const pages=[...new Set(getDocumentPages(docId).map(chunk=>chunk.page))];
    const sampled=Array.from({length:Math.min(7,pages.length)},(_,i)=>pages[Math.round(i*(pages.length-1)/Math.max(1,Math.min(7,pages.length)-1))]);
    found=sampled.flatMap(number=>{const source=getPageSource(docId,number);return source?[source]:[];});
  }
  return focused?[focused,...found.filter(source=>source.page!==focused.page||source.docId!==focused.docId)].slice(0,7):found;
}
