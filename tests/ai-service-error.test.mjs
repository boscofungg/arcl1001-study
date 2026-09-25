import test from 'node:test';import assert from 'node:assert/strict';
import {classifyAIError,aiServiceError} from '../lib/ai-service-error.ts';
test('identifies invalid, blocked and denied credentials without exposing provider data',()=>{
 const secret='sensitive-provider-metadata';
 for(const [status,body,code] of [[400,{error:{message:secret,details:[{reason:'API_KEY_INVALID',metadata:{key:secret}}]}},'AI_KEY_INVALID'],[403,{error:{message:`Your API key was reported as leaked. ${secret}`}},'AI_KEY_BLOCKED'],[403,{error:{message:secret}},'AI_ACCESS_DENIED']]){const result=classifyAIError(status,body);assert.equal(result.code,code);assert.ok(!result.message.includes(secret));}
});
test('separates quota, unavailable models and malformed requests safely',async()=>{
 for(const [status,code] of [[429,'AI_QUOTA'],[404,'AI_MODEL_UNAVAILABLE'],[400,'AI_REQUEST_INVALID'],[503,'AI_UNAVAILABLE']])assert.equal(classifyAIError(status,null).code,code);
 const error=await aiServiceError(new Response('not json',{status:503}));assert.match(error.message,/temporarily unavailable/);
 assert.equal(classifyAIError(400,{error:{message:'API key not valid. Please pass a valid API key.'}}).code,'AI_KEY_INVALID');
});
