/** Deliberately limited spelling help, not fuzzy semantic grading. */
const names = ['belgium', 'dmanisi', 'gobekli', 'guatemala', 'harappa', 'luoyang', 'mesopotamia', 'mohenjo', 'neanderthal', 'pakistan', 'saqqara', 'sneferu'];
const terms = ['agriculture', 'agricultural', 'archaeology', 'archaeological', 'carbohydrate', 'carbohydrates', 'cultivation', 'excavation', 'flotation', 'floatation', 'geomorphology', 'irrigation', 'perforated', 'preservation', 'sedimentology', 'stratigraphy', 'temperature', 'thermoregulation'];
const vocabulary = new Set([...names, ...terms]);

function adjacentSwap(a:string,b:string){
 if(a.length!==b.length)return false;
 const mismatch=[...a].flatMap((letter,i)=>letter!==b[i]?[i]:[]);
 return mismatch.length===2&&mismatch[1]===mismatch[0]+1&&a[mismatch[0]]===b[mismatch[1]]&&a[mismatch[1]]===b[mismatch[0]];
}
function oneEdit(a:string,b:string){
 if(Math.abs(a.length-b.length)>1)return false;
 if(a.length===b.length)return [...a].filter((letter,i)=>letter!==b[i]).length===1||adjacentSwap(a,b);
 const shorter=a.length<b.length?a:b,longer=a.length<b.length?b:a;
 let i=0;while(i<shorter.length&&shorter[i]===longer[i])i++;
 return shorter.slice(i)===longer.slice(i+1);
}
function repeatedLetter(a:string,b:string){
 return a.length===b.length+1&&[...a].some((letter,i)=>i>0&&letter===a[i-1]&&a.slice(0,i)+a.slice(i+1)===b);
}

export function tolerateSlideSpelling(text:string):{text:string;corrections:{from:string;to:string}[]}{
 const corrections:{from:string;to:string}[]=[];
 // Keep digits, punctuation and every unrecognised word unchanged. In particular,
 // never approximate short answers, dates, negation or relational words.
 const corrected=text.replace(/\b[a-z]+\b/g,word=>{
  if(word.length<6||vocabulary.has(word))return word;
  const candidates=[...names.filter(name=>oneEdit(word,name)),...terms.filter(term=>adjacentSwap(word,term)||repeatedLetter(word,term))];
  if(candidates.length!==1)return word;
  corrections.push({from:word,to:candidates[0]});return candidates[0];
 });
 return {text:corrected,corrections};
}
