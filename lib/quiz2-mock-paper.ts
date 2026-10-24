import images from '../content/quiz2-mock-images.json' with {type:'json'};
import text from '../content/quiz2-mock-text.json' with {type:'json'};
import {mapSets} from './quiz2-map-data.ts';
import {createMockPaper as create,parseMockLibrary as parse,type MockSyllabus,type MockPaper} from './mock-paper.ts';
export {chronologyAnswer,chronologyFeedback,sentenceCount} from './mock-paper.ts';
export type {MockPaper,MockLibrary} from './mock-paper.ts';
export const mockBank={images,...text};
export const quiz2Syllabus:MockSyllabus={bank:mockBank,mapSets};
export function createMockPaper(previous:MockPaper[]=[],random:()=>number=Math.random){
 const paper=create(previous,random,quiz2Syllabus);
 const lectures=['d111','d114','d122','d123'];
 const offset=(paper.id-1)%lectures.length;
 // Rotate the written tasks across lectures and use an image from the fourth.
 paper.concept=mockBank.concepts.find(q=>q.sources[0].docId===lectures[offset])!.id;
 paper.significance=mockBank.significance.find(q=>q.sources[0].docId===lectures[(offset+1)%4])!.id;
 paper.discussion=mockBank.discussions.find(q=>q.sources[0].docId===lectures[(offset+2)%4])!.id;
 const remaining=lectures[(offset+3)%4];
 if(!paper.images.some(id=>mockBank.images.find(q=>q.id===id)!.sources[0].docId===remaining)){
  const options=mockBank.images.filter(q=>q.sources[0].docId===remaining);
  const unseen=options.filter(q=>!previous.at(-1)?.images.includes(q.id));
  const pool=unseen.length?unseen:options;
  paper.images[2]=pool[Math.floor(Math.max(0,Math.min(.999999,random()))*pool.length)].id;
 }
 if(paper.id%2===0){paper.dates[0].a.era='CE';paper.dates[0].b.era='CE';}
 return paper;
}
export const parseMockLibrary=(raw:string)=>parse(raw,quiz2Syllabus);
