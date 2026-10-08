import test from 'node:test';import assert from 'node:assert/strict';
import {studySheet,studyCsv} from '../lib/study-export.ts';
const items=[{question:'Identify <this> & explain',answer:'A "quipu".\nUsed for records.',image:{src:'/quiz1/q-001.webp'},sources:[{docId:'d111',page:34,title:'Lecture 4',label:'Slide 34'}]}];
test('offline sheets embed question images and separate exact model answers and sources',()=>{
 const sheet=studySheet('My set',items,{'/quiz1/q-001.webp':'data:image/webp;base64,AAAA'});
 assert.ok(sheet.includes('data:image/webp;base64,AAAA'));assert.ok(sheet.includes('Identify &lt;this&gt; &amp; explain'));
 assert.ok(sheet.indexOf('Model answers &amp; sources')>sheet.indexOf('class="space"'));assert.ok(sheet.includes('A &quot;quipu&quot;.\nUsed for records.'));
 assert.ok(sheet.includes('?doc=d111&amp;page=34'));assert.ok(!sheet.includes('<script'));
});
test('questions-only export omits model answers and source clues',()=>{
 const html=studySheet('Questions',items,{},false);assert.ok(!html.includes('quipu'));assert.ok(!html.includes('Slide 34'));assert.ok(!html.includes('answer-key"><h2'));
 const csv=studyCsv(items,false);assert.ok(!csv.includes('Used for records'));assert.ok(!csv.includes('Model answer'));
});
test('export escapes untrusted text and prevents CSV spreadsheet formulas',()=>{
 const evil=[{question:'=HYPERLINK("bad")',answer:'<script>alert(1)</script>',sources:[{docId:'d111',page:1,title:'<img onerror=alert(1)>',label:'Slide 1'}]}];
 const csv=studyCsv(evil);assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));assert.ok(csv.startsWith('\ufeff'));
 const html=studySheet('<script>',evil,{});assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<img onerror'));
});
