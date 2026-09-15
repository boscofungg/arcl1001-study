import type { Source } from './retrieval';

/** Select only cited source visuals that were actually supplied to the model. */
export function referencedVisuals(text:string,sources:Source[],reviewedSources:number[]=[]){
  const reviewed=new Set(reviewedSources);
  const seen=new Set<string>();
  const visuals:{citation:number;source:Source;image:NonNullable<Source['images']>[number]}[]=[];
  for(const match of text.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)){
    for(const number of match[1].split(',')){
      const citation=Number(number.trim());
      const source=sources[citation-1];
      if(!source||!reviewed.has(citation))continue;
      const image=source.images?.[0];
      if(!image||!/^\/materials\/d\d+\/[a-zA-Z0-9._-]+\.webp$/.test(image.src)||seen.has(image.src))continue;
      seen.add(image.src);visuals.push({citation,source,image});
      if(visuals.length===3)return visuals;
    }
  }
  return visuals;
}
