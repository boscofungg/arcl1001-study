import images from '../content/quiz3-mock-images.json' with {type:'json'};
import text from '../content/quiz3-mock-text.json' with {type:'json'};
import {quiz3MapSets} from './quiz3-map-data.ts';
import {createMockPaper as create,parseMockLibrary as parse,type MockSyllabus,type MockPaper} from './mock-paper.ts';

/** Quiz 3 (Lectures 8–11): same six-part template as Quiz 2, separate bank and storage. */
export const quiz3Bank={images,...text} as unknown as MockSyllabus['bank'];
export const quiz3Syllabus:MockSyllabus={bank:quiz3Bank,mapSets:quiz3MapSets};
export const quiz3Lectures=['d124','d126','d128','d131'];
export function createQuiz3Paper(previous:MockPaper[]=[],random:()=>number=Math.random){
 const paper=create(previous,random,quiz3Syllabus);
 const bank=quiz3Bank,lectures=quiz3Lectures;
 const offset=(paper.id-1)%lectures.length;
 // Rotate the written tasks across lectures and make sure an image covers the fourth.
 paper.concept=bank.concepts.find(q=>q.sources[0].docId===lectures[offset])!.id;
 paper.significance=bank.significance.find(q=>q.sources[0].docId===lectures[(offset+1)%4])!.id;
 paper.discussion=bank.discussions.find(q=>q.sources[0].docId===lectures[(offset+2)%4])!.id;
 const remaining=lectures[(offset+3)%4];
 if(!paper.images.some(id=>bank.images.find(q=>q.id===id)!.sources[0].docId===remaining)){
  const options=bank.images.filter(q=>q.sources[0].docId===remaining&&!paper.images.includes(q.id));
  const unseen=options.filter(q=>!previous.at(-1)?.images.includes(q.id));
  const pool=unseen.length?unseen:options;
  paper.images[2]=pool[Math.floor(Math.max(0,Math.min(.999999,random()))*pool.length)].id;
 }
 if(paper.id%2===0){paper.dates[0].a.era='CE';paper.dates[0].b.era='CE';}
 return paper;
}
export const parseQuiz3Library=(raw:string)=>parse(raw,quiz3Syllabus);
