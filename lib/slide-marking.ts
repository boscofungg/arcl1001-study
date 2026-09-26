import feedbackRubrics from '../content/feedback-rubrics.json' with {type:'json'};
import l4Rubrics from '../content/l4-rubrics.json' with {type:'json'};
import shortRubrics from '../content/slide-short-rubrics.json' with {type:'json'};
import {slideQuestions} from './slide-practice.ts';
import {matchNumericAnswer} from './numeric-marking.ts';
import type {NumericRule} from './numeric-marking.ts';
export type MarkCriterion={id:string;label:string;patterns?:string[];allowNegation?:boolean;excludePatterns?:string[];numeric?:NumericRule;tolerance?:string};
export type SlideRubric={questionId:string;requiredCount?:number;criteria:MarkCriterion[]};
export type SlideMark={status:'correct'|'partial'|'needs-review';score:number;maxScore:number;feedback:string;criteria:{id:string;label:string;matched:boolean;feedback?:string;tolerance?:string}[];modelAnswer:string};
const term=(id:string,label:string,...patterns:string[]):MarkCriterion=>({id,label,patterns});
const bce=(min:number,max:number):NumericRule=>({kind:'bce',min,max});
const range=(startMin:number,startMax:number,endMin:number,endMax:number):NumericRule=>({kind:'bce',min:Math.min(startMin,endMin),max:Math.max(startMax,endMax),range:{startMin,startMax,endMin,endMax}});
const date=(numeric:NumericRule,tolerance:string,patterns?:string[]):MarkCriterion=>({id:'date',label:'Approximate date / period',numeric,tolerance,patterns});
const site=(...patterns:string[])=>term('site','Site / find location',...patterns);
const name=(...patterns:string[])=>term('identity','Identification',...patterns);
const location=(...patterns:string[])=>term('location','Country / region',...patterns);
const uncertain:MarkCriterion={id:'interpretation',label:'Conventional name is not a confirmed occupation',allowNegation:true,patterns:['\\b(?:not|never|doesnt|cannot|cant)\\b.{0,45}\\b(?:prove|establish|confirm|confirmed|known|certain)\\b','\\b(?:uncertain|unconfirmed|unproven|unknown|not necessarily|just a (?:name|label)|only a (?:name|label))\\b'],excludePatterns:['\\b(?:proves?|confirms?|definitely|certainly)\\b.{0,35}\\b(?:king|priest|ruler|occupation)\\b']};
const visualRubrics:SlideRubric[]=[
 {questionId:'visual-001',criteria:[name('\\btoothless\\b','\\bhomo erectus(?: georgicus)?\\b','\\bdmanisi (?:man|individual|skull|hominin)\\b'),site('\\bdmanisi\\b','\\bgeorgia\\b'),date({kind:'yearsAgo',min:1600000,max:1800000},'1.6–1.8 million years ago (model: 1.7 million).')]},
 {questionId:'visual-002',criteria:[name('\\bengis\\s*2\\b','\\bneandert[ha]*l\\b'),location('\\bbelgi(?:um|an)\\b'),date({kind:'yearsAgo',min:35000,max:45000},'35,000–45,000 years ago (model: about 40,000).')]},
 {questionId:'visual-003',criteria:[name('\\bgobekli\\s*tepe\\b','\\bgobekli\\b'),location('\\bturkey\\b','\\bturkiye\\b','\\bturkish\\b'),date(range(9000,10000,7500,8500),'Start: 10,000–9,000 BCE; end: 8,500–7,500 BCE (model: 9500–8000 BCE).')]},
 {questionId:'visual-004',criteria:[name('\\b(?:warka|uruk) vase\\b'),site('\\buruk\\b','\\bwarka\\b'),date(bce(2900,3100),'3100–2900 BCE (model: about 3000 BCE).')]},
 {questionId:'visual-005',criteria:[name('\\bbevel(?:led|ed)? rim(?:med)? (?:bowl|bowls)\\b'),site('\\buruk\\b','\\bwarka\\b'),date(range(3200,3400,3000,3200),'Start: 3400–3200 BCE; end: 3200–3000 BCE (model: 3300–3100 BCE).')]},
 {questionId:'visual-006',criteria:[name('\\bstep pyramid\\b','\\b(?:djoser|zoser)(?:s)? pyramid\\b'),location('\\bsaqq?ara\\b','\\bsakkara\\b'),date(bce(2600,2700),'27th century BCE, or about 2700–2600 BCE.')]},
 {questionId:'visual-007',criteria:[name('\\bbent pyramid\\b'),term('ruler','Associated ruler','\\bsnefru\\b','\\bsneferu\\b'),date(bce(2500,2600),'26th century BCE, or about 2600–2500 BCE.')]},
 {questionId:'visual-008',criteria:[name('\\bpriest ?king\\b'),site('\\bmohenjo ?daro\\b'),date(bce(1850,2050),'2050–1850 BCE (model: about 1950 BCE).'),uncertain]},
 {questionId:'visual-009',criteria:[name('\\bgreat bath\\b','\\blarge (?:public )?water tank\\b'),site('\\bmohenjo ?daro\\b'),date(range(2500,2700,1800,2000),'Mature Harappan, or a range starting 2700–2500 BCE and ending 2000–1800 BCE.',['\\bmature harappan\\b'])]},
 {questionId:'visual-010',criteria:[name('\\bowl\\b.{0,35}\\b(?:zun|vessel|bronze)\\b','\\bzun\\b.{0,35}\\bowl\\b'),site('\\bfu hao(?:s)?\\b','\\byin ?xu\\b','\\banyang\\b'),date(bce(1100,1300),'Late Shang / Anyang period, or about 1300–1100 BCE (model: 1200 BCE).',['\\b(?:late )?shang(?: dynasty)?\\b','\\banyang period\\b'])]},
 {questionId:'visual-011',criteria:[name('\\byue\\b','\\b(?:bronze |ritual |ceremonial |battle )?axe\\b'),site('\\bfu hao(?:s)?\\b','\\byin ?xu\\b','\\banyang\\b'),date(bce(1100,1300),'Late Shang / Anyang period, or about 1300–1100 BCE (model: 1200 BCE).',['\\b(?:late )?shang(?: dynasty)?\\b','\\banyang period\\b'])]},
 {questionId:'visual-012',criteria:[name('\\b(?:perforated|pierced)\\b.{0,35}\\b(?:jar|vessel|pot)\\b','\\b(?:jar|vessel|pot)\\b.{0,35}\\b(?:holes|perforations)\\b'),site('\\bhar+ap+a\\b'),date(range(2400,2600,1900,2100),'Start: 2600–2400 BCE; end: 2100–1900 BCE (model: 2500–2000 BCE).')]},
 {questionId:'visual-013',criteria:[name('\\bmohenjo ?daro\\b'),location('\\bpakistan(?:i)?\\b','\\bsindh?\\b')]},
 {questionId:'visual-014',criteria:[name('\\bhar+ap+a\\b'),location('\\bpakistan(?:i)?\\b','\\bpunjab\\b')]},
 {questionId:'visual-015',criteria:[name('\\ber ?li ?tou\\b'),location('\\bchin(?:a|ese)\\b','\\byiluo\\b','\\bluoyang\\b','\\bhenan\\b')]},
 {questionId:'visual-016',criteria:[name('\\byin ?xu\\b','\\banyang\\b'),location('\\bchin(?:a|ese)\\b','\\bhenan\\b')]},
 {questionId:'visual-017',criteria:[name('\\buruk\\b','\\bwarka\\b'),location('\\bsumer(?:ia|ian)?\\b','\\bsouthern mesopotamia\\b')]},
 {questionId:'visual-018',criteria:[name('\\bgiza\\b','\\bgizeh\\b'),location('\\begypt(?:ian)?\\b','\\b(?:lower )?nile valley\\b')]},
];
export const slideRubrics:SlideRubric[]=[...shortRubrics,...visualRubrics,...l4Rubrics,...feedbackRubrics];
const normalize=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
function isNegated(text:string,start:number,length:number,allowWithin=false){
 const before=text.slice(0,start).split(/\s+/).slice(-4).join(' ');
 const span=text.slice(start,start+length);
 const negative=/\b(?:not|never|neither|without|isnt|arent|wasnt|werent|dont|doesnt|cannot|cant|no)\b/;
 return negative.test(before)||(!allowWithin&&negative.test(span));
}
function patternMatches(text:string,pattern:string,allowNegation=false){
 const expression=new RegExp(pattern,'g');let match;
 while((match=expression.exec(text))){if(!isNegated(text,match.index,match[0].length,allowNegation))return true;if(!match[0].length)expression.lastIndex++;}
 return false;
}
function matchCriterion(answer:string,criterion:MarkCriterion){
 const normalized=normalize(answer);
 if(criterion.excludePatterns?.some(pattern=>patternMatches(normalized,pattern)))return {matched:false,feedback:'This part conflicts with the slide evidence.'};
 const wordMatch=criterion.patterns?.some(pattern=>patternMatches(normalized,pattern,criterion.allowNegation))||false;
 if(criterion.numeric){
  const numeric=matchNumericAnswer(answer,criterion.numeric);
  // A named period is sufficient only if the student has not also supplied a conflicting explicit date.
  const hasDate=/\d.{0,25}\b(?:bce?|a\.?d|ce|mya|kya|ka|years?|century)\b|\b(?:bce?|ce|ad)\s*\d/i.test(answer);
  if(wordMatch&&!hasDate)return {matched:true};
  return numeric;
 }
 return {matched:wordMatch};
}
export function markSlideAnswer(questionId:string,answer:string):SlideMark|null{
 const question=slideQuestions.find(q=>q.id===questionId),rubric=slideRubrics.find(r=>r.questionId===questionId);
 if(!question||!rubric||typeof answer!=='string'||answer.length>2000)return null;
 const criteria=rubric.criteria.map(criterion=>({...matchCriterion(answer,criterion),id:criterion.id,label:criterion.label,...criterion.tolerance?{tolerance:criterion.tolerance}:{}}));
 const maxScore=rubric.requiredCount||criteria.length,score=Math.min(maxScore,criteria.filter(c=>c.matched).length);
 const status=score===maxScore?'correct':score>0?'partial':'needs-review';
 return {status,score,maxScore,criteria,modelAnswer:question.answer,feedback:status==='correct'?'Your answer covers the required points.':status==='partial'?`You covered ${score} of ${maxScore} required points. Check the remaining parts below.`:'The required points were not recognised. Compare the model answer and slide evidence.'};
}
