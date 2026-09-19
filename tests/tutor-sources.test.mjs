import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorSources} from '../lib/tutor-sources.ts';
test('individual reading summary is available without topic keywords',()=>{
 const sources=tutorSources('Summarize the main ideas in this reading.',2,'d107');
 assert.ok(sources.length);assert.ok(sources.every(s=>s.docId==='d107'));
});
test('a focused page never escapes the selected reading',()=>{
 const sources=tutorSources('Compare Egypt and Uruk',2,'d106',4);
 assert.equal(sources[0].page,4);assert.ok(sources.every(s=>s.docId==='d106'));
});
test('whole-document overview samples multiple pages and skips unindexed frontmatter',()=>{
 const sources=tutorSources('Give an overview',2,'d106');
 assert.ok(sources.length>1);assert.ok(sources.every(s=>s.page>=4));
});
test('cross-lecture questions remain available in all-materials mode',()=>{
 const sources=tutorSources('Compare Uruk and Mohenjo-daro');
 assert.ok(sources.some(s=>s.week===2));assert.ok(sources.some(s=>s.week===3));
});

test('Lecture 3 Principles questions stay within the new reading',()=>{
 const sources=tutorSources('Explain ceramic analysis',3,'d110');
 assert.ok(sources.length);assert.ok(sources.every(s=>s.docId==='d110'&&s.page>=4));
});
