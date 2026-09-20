import {makeQuiz1Set,parseQuiz1Review,rateQuiz1,retryQuiz1} from './quiz1-practice.ts';
import {markSlideAnswer} from './slide-marking.ts';
import type {Quiz1Kind,Quiz1Question,Quiz1Review} from './quiz1-types.ts';
export type SlideResponse={text:string;mode:'marked'|'revealed'};
export type MarkedSlideReview={version:2;review:Quiz1Review;answers:Record<string,SlideResponse>};
export function startMarkedSet(bank:Quiz1Question[],kind:Quiz1Kind|'mixed',count:number):MarkedSlideReview{return {version:2,review:makeQuiz1Set(bank,kind,count),answers:{}};}
export function recordSlideResponse(state:MarkedSlideReview,text:string,mode:SlideResponse['mode']):MarkedSlideReview{
 const id=state.review.queue[state.review.position];
 if(!id||state.answers[id]||typeof text!=='string'||text.length>2000||!['marked','revealed'].includes(mode)||(mode==='marked'&&!text.trim())||!markSlideAnswer(id,text))return state;
 return {...state,answers:{...state.answers,[id]:{text:text.trim(),mode}}};
}
export function advanceMarkedSet(state:MarkedSlideReview):MarkedSlideReview{
 const id=state.review.queue[state.review.position],answer=state.answers[id];
 if(!answer)return state;
 const mark=answer.mode==='marked'?markSlideAnswer(id,answer.text):null;
 return {...state,review:rateQuiz1(state.review,mark?.status==='correct'?'known':'again')};
}
export function retryMarkedSet(state:MarkedSlideReview):MarkedSlideReview{return {version:2,review:retryQuiz1(state.review),answers:{}};}
export function parseMarkedSet(raw:string,bank:Quiz1Question[]):MarkedSlideReview|null{
 try{
  if(!raw||raw.length>200000)return null;
  const data=JSON.parse(raw);
  if(data?.version!==2||!data.answers||typeof data.answers!=='object'||Array.isArray(data.answers))return null;
  const review=parseQuiz1Review(JSON.stringify(data.review),bank);
  if(!review)return null;
  const answers:Record<string,SlideResponse>={};
  for(const [id,value] of Object.entries(data.answers)){
   const a=value as SlideResponse;
   if(!review.queue.slice(0,review.position+1).includes(id)||!a||typeof a.text!=='string'||a.text.length>2000||!['marked','revealed'].includes(a.mode)||(a.mode==='marked'&&!a.text.trim()))return null;
   answers[id]={text:a.text,mode:a.mode};
  }
  if(review.queue.slice(0,review.position).some(id=>!answers[id]))return null;
  // Derive completed ratings from the stored response, never from an editable score.
  for(const id of review.queue.slice(0,review.position))review.ratings[id]=answers[id].mode==='marked'&&markSlideAnswer(id,answers[id].text)?.status==='correct'?'known':'again';
  return {version:2,review,answers};
 }catch{return null;}
}
export function markedSetTotals(state:MarkedSlideReview){
 const marks=Object.entries(state.answers).flatMap(([id,a])=>{const mark=a.mode==='marked'?markSlideAnswer(id,a.text):null;return mark?[mark]:[];});
 return {attempted:marks.length,revealed:Object.values(state.answers).filter(a=>a.mode==='revealed').length,score:marks.reduce((n,m)=>n+m.score,0),maxScore:marks.reduce((n,m)=>n+m.maxScore,0)};
}
