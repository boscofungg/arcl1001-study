import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import documents from '../lib/documents.json' with {type:'json'};
import visuals from '../lib/visuals.json' with {type:'json'};
import { getPageSource, getSource, mergePageText } from '../lib/retrieval.ts';
import { buildVisualContext } from '../lib/visual-context.ts';

test('every original page including hidden and image-only slides has a valid preview',()=>{
 let pages=0;
 for(const doc of documents){
   const visual=visuals[doc.id];assert.ok(visual,doc.id);assert.equal(visual.pages.length,doc.pages);
   for(const [index,page] of visual.pages.entries()){
     assert.equal(page.page,index+1);assert.ok(page.images.length);
     for(const image of page.images){assert.ok(existsSync('public'+image.src));assert.ok(image.width>0&&image.height>0);}
     pages++;
   }
 }
 assert.equal(pages,4018);
});
test('image-only pages produce resolvable source citations without inventing text',()=>{
 const source=getPageSource('d001',1);
 assert.ok(source);assert.ok(source.images.length);
 assert.equal(getSource(source.id).page,1);
 assert.equal(getPageSource('d001',170),null);
 assert.equal(getPageSource('d001',0),null);
 assert.equal(getPageSource('d001',1.5),null);
 assert.equal(getSource('d001-p170-visual'),null);
});
test('page text removes chunk overlap without losing material',()=>{
 const text='a'.repeat(1400)+'b'.repeat(200)+'c'.repeat(400);
 const merged=mergePageText([{id:'a',docId:'d',page:1,text:text.slice(0,1600)},{id:'b',docId:'d',page:1,text:text.slice(1400)}]);
 assert.equal(merged,text);
});
test('Gemini receives original WebP bytes and matching citation labels, bounded to four images',async()=>{
 const result=await buildVisualContext([1,2,3,4,5,6].map(page=>getPageSource('d001',page)));
 assert.equal(result.visualsUsed,4);assert.equal(result.failedVisuals,0);
 assert.deepEqual(result.reviewedSources,[1,2,3,4]);
 for(const part of result.parts.filter(p=>'inlineData' in p)){
   assert.equal(part.inlineData.mimeType,'image/webp');
   assert.equal(Buffer.from(part.inlineData.data,'base64').subarray(8,12).toString(),'WEBP');
 }
});
test('invalid image paths fail safely instead of reading arbitrary files',async()=>{
 const source={...getPageSource('d001',1),images:[{src:'/materials/d001/../../.env',width:1,height:1,alt:'bad'}]};
 const result=await buildVisualContext([source]);
 assert.equal(result.visualsUsed,0);assert.equal(result.failedVisuals,1);assert.deepEqual(result.parts,[]);
});
test('repeat questions reuse page-image bytes and cancelled requests stop before work',async(t)=>{
 const previous=process.env.VERCEL;
 process.env.VERCEL='1';
 let downloads=0;
 const bytes=Buffer.from('RIFF0000WEBPtest');
 const fetchMock=t.mock.method(globalThis,'fetch',async()=>{downloads++;return new Response(bytes,{headers:{'Content-Type':'image/webp'}});});
 try{
   const source=getPageSource('d001',169);
   await buildVisualContext([source]);await buildVisualContext([source]);
   assert.equal(downloads,1);
   const controller=new AbortController();controller.abort();
   await assert.rejects(buildVisualContext([source],controller.signal),{name:'AbortError'});
   assert.equal(downloads,1);
 }finally{fetchMock.mock.restore();if(previous===undefined)delete process.env.VERCEL;else process.env.VERCEL=previous;}
});
