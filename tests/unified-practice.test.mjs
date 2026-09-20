import test from 'node:test';
import assert from 'node:assert/strict';
import documents from '../lib/documents.json' with {type:'json'};
import {getPracticePool, selectPracticeQuestions, selectMissionQuestions, missions, questionBank, newProgress, recordAttempt, recordGradedAttempt, parseProgress} from '../lib/expedition.ts';

const all = {lecture:0,format:'mixed',kind:'mixed',count:10};
const now = '2026-09-22T10:00:00.000Z';

test('unified practice filters lecture, format and kind together, including reading sources', () => {
  assert.equal(getPracticePool(all).length,45);
  for(const lecture of [1,2,3]) {
    const pool=getPracticePool({...all,lecture});
    assert.equal(pool.length,15);
    assert.ok(pool.every(q=>documents.find(d=>d.id===q.source.docId)?.week===lecture));
  }
  for(const format of ['mcq','blank']) for(const kind of ['image','map','short-answer','comparison']) {
    const scope={...all,lecture:2,format,kind};
    const expected=questionBank.filter(q=>documents.find(d=>d.id===q.source.docId)?.week===2&&q.format===format&&q.kind===kind);
    assert.deepEqual(getPracticePool(scope),expected);
    assert.ok(selectPracticeQuestions(newProgress(),scope).every(id=>expected.some(q=>q.id===id)));
  }
  assert.ok(getPracticePool({...all,lecture:2}).some(q=>q.source.docId==='d107'));
  assert.ok(getPracticePool({...all,lecture:3}).some(q=>q.source.docId==='d109'));
  assert.ok(getPracticePool({...all,lecture:3}).some(q=>q.source.docId==='d110'));
});

test('unknown scopes and unsupported round sizes fail closed', () => {
  for(const scope of [null,undefined,{}, {...all,lecture:4},{...all,lecture:'2'}, {...all,format:'essay'}, {...all,kind:'unknown'}]) {
    assert.deepEqual(getPracticePool(scope),[]);
    assert.deepEqual(selectPracticeQuestions(newProgress(),scope),[]);
  }
  for(const count of [0,1,6,100,NaN,'5']) assert.deepEqual(selectPracticeQuestions(newProgress(),{...all,count}),[]);
});

test('unified practice caps rounds at available questions without duplicates', () => {
  for(const random of [()=>0,()=>1,()=>NaN,()=>-1]) {
    const queue=selectPracticeQuestions(newProgress(),all,random);
    assert.equal(queue.length,10);
    assert.equal(new Set(queue).size,10);
    assert.deepEqual(new Set(queue.map(id=>questionBank.find(q=>q.id===id).format)),new Set(['mcq','blank']));
    assert.ok(queue.some(id=>questionBank.find(q=>q.id===id).image));
  }
  const scope={...all,lecture:2,kind:'map'};
  assert.equal(selectPracticeQuestions(newProgress(),scope).length,getPracticePool(scope).length);
  assert.deepEqual(selectPracticeQuestions(newProgress(),{...all,lecture:1,kind:'map'}),[]);
});

test('practice prioritizes unseen questions then missed questions before previously correct ones', () => {
  const scope={...all,lecture:2};
  const pool=getPracticePool(scope);
  let state=newProgress();
  for(const [i,q] of pool.entries()) if(i>=2) state=recordAttempt(state,q.id,i<6?'again':'known',false,`event-${i}`,now);
  const queue=selectPracticeQuestions(state,{...scope,count:5},()=>.4);
  assert.deepEqual(new Set(queue.slice(0,2)),new Set(pool.slice(0,2).map(q=>q.id)));
  assert.ok(queue.slice(2).every(id=>pool.slice(2,6).some(q=>q.id===id)));
  const before=JSON.stringify(state);
  selectPracticeQuestions(state,scope);
  assert.equal(JSON.stringify(state),before);
});

test('existing saved mission queue IDs and grades remain valid in unified practice', () => {
  const poolIds=new Set(getPracticePool(all).map(q=>q.id));
  for(const mission of missions) {
    const savedQueue=selectMissionQuestions(newProgress(),mission.id,5,()=>.2);
    assert.ok(savedQueue.every(id=>poolIds.has(id)));
    assert.deepEqual(selectPracticeQuestions(newProgress(),{...all,lecture:mission.lecture,count:5},()=>.2),savedQueue);
  }
  const saved=recordGradedAttempt(newProgress(),'q1-text-01','physical remains',false,'saved-grade',now);
  const restored=parseProgress(JSON.stringify(saved));
  selectPracticeQuestions(restored,all);
  assert.deepEqual(restored,saved);
  assert.equal(restored.attempts[0].rating,'known');
  assert.equal(restored.attempts[0].response,'physical remains');
});
