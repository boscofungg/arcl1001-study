import test from 'node:test';import assert from 'node:assert/strict';
import {claudeRequest,readClaudeText,streamClaudeText,claudeConfigured} from '../lib/hku-claude.ts';
test('HKU requests use server credentials, bounded config and retain text/image content',async()=>{
 const fetchOriginal=global.fetch,keyOriginal=process.env.HKU_CLAUDE_KEY,modelOriginal=process.env.HKU_CLAUDE_MODEL;
 process.env.HKU_CLAUDE_KEY='test-private-key';process.env.HKU_CLAUDE_MODEL='claude-haiku-4.5';
 try{global.fetch=async(url,init)=>{assert.equal(url.origin,'https://api.hku.hk');assert.equal(url.searchParams.get('subscription-key'),'test-private-key');assert.ok(url.pathname.endsWith('/converse-stream'));const body=JSON.parse(init.body);assert.equal(body.system[0].text,'Tutor');assert.equal(body.messages[0].content[1].image.source.bytes,'bytes');assert.equal(init.redirect,'error');return Response.json({});};await claudeRequest({system:'Tutor',messages:[{role:'user',content:[{text:'Read source'},{image:{format:'webp',source:{bytes:'bytes'}}}]}],maxTokens:100,stream:true,signal:new AbortController().signal});
 for(const status of [400,401,403,404,429,500]){global.fetch=async()=>new Response('test-private-key sensitive upstream detail',{status});await assert.rejects(claudeRequest({system:'Tutor',messages:[],maxTokens:100,signal:new AbortController().signal}),e=>!e.message.includes('test-private-key')&&!e.message.includes('sensitive upstream'));}
 global.fetch=async()=>{throw Error('https://api.hku.hk/?subscription-key=test-private-key');};await assert.rejects(claudeRequest({system:'Tutor',messages:[],maxTokens:100,signal:new AbortController().signal}),e=>!e.message.includes('test-private-key'));
 delete process.env.HKU_CLAUDE_KEY;assert.equal(claudeConfigured(),false);
 }finally{global.fetch=fetchOriginal;if(keyOriginal===undefined)delete process.env.HKU_CLAUDE_KEY;else process.env.HKU_CLAUDE_KEY=keyOriginal;if(modelOriginal===undefined)delete process.env.HKU_CLAUDE_MODEL;else process.env.HKU_CLAUDE_MODEL=modelOriginal;}
});
test('Converse text responses require content and completion metadata',async()=>{
 const response=()=>Response.json({output:{message:{content:[{text:'Hello'},{text:' world'}]}},stopReason:'end_turn'});
 assert.deepEqual(await readClaudeText(response()),{text:'Hello world',stopReason:'end_turn'});let received='';assert.deepEqual(await streamClaudeText(response(),text=>received+=text),{stopReason:'end_turn'});assert.equal(received,'Hello world');await assert.rejects(readClaudeText(Response.json({output:{message:{content:[]}},stopReason:'end_turn'})));await assert.rejects(readClaudeText(new Response('bad json')));
});
