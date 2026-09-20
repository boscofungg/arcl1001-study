import documents from '../lib/documents.json' with {type:'json'};
import test from 'node:test';
import assert from 'node:assert/strict';
import { missions, questionBank, newProgress, parseProgress, recordAttempt, setWeeklyGoal, getMissedQuestionIds, getCompletedMissionIds, getComebackCount, getWeeklySessionsCount, missionProgress, getEvidenceCheckedCount, getLatestAttempt, selectMissionQuestions } from '../lib/expedition.ts';
const time = '2026-09-20T12:00:00.000Z';
const id = missions[0].questionIds[0];
const add = (state, questionId = id, rating = 'again', event = 'event-1', at = time, evidence = false) => recordAttempt(state, questionId, rating, evidence, event, at);

test('three missions each contain fifteen unique source-backed questions from their lecture', () => {
  assert.equal(missions.length, 3);
  for (const mission of missions) {
    assert.equal(new Set(mission.questionIds).size, 15);
    const questions = mission.questionIds.map(id => questionBank.find(q => q.id === id));
    for (const question of questions) {
      assert.ok(question);
      assert.equal(documents.find(d=>d.id===question.source.docId)?.week, mission.lecture);
      assert.ok(question.answer && question.evidence && question.source.page > 0);
    }
    assert.ok(questions.some(q => q.kind === 'image'));
    assert.ok(questions.some(q => q.kind === 'short-answer'));
  }
  assert.ok(missions.slice(1).every(m => m.questionIds.some(id => questionBank.find(q => q.id === id).kind === 'map')));
});

test('five distinct attempts retain discovery completion as the bank expands', () => {
  let state = newProgress();
  missions[0].questionIds.slice(0,5).forEach((id, i) => { state = add(state, id, 'again', `event-${i}`); });
  assert.deepEqual(missionProgress(state, missions[0].id), { attempted: 5, total: 15, complete: true });
  assert.deepEqual(getCompletedMissionIds(state), [missions[0].id]);
  assert.equal(getMissedQuestionIds(state).length, 5);
  assert.deepEqual(missionProgress(state, 'unknown'), { attempted: 0, total: 0, complete: false });
});

test('attempt IDs are idempotent and cannot farm comeback or evidence rewards', () => {
  let state = add(newProgress());
  assert.equal(add(state, id, 'known'), state);
  assert.equal(getComebackCount(state), 0);
  state = add(state, id, 'known', 'event-2', time, true);
  assert.equal(getComebackCount(state), 1);
  assert.deepEqual(getMissedQuestionIds(state), []);
  state = add(add(state, id, 'again', 'event-3'), id, 'known', 'event-4', time, true);
  assert.equal(getComebackCount(state), 1);
  assert.equal(getEvidenceCheckedCount(state), 1);
  assert.equal(getLatestAttempt(state, id).rating, 'known');
  assert.equal(getWeeklySessionsCount(state, time), 1);
});

test('a known first attempt is not a comeback and a later miss returns to the queue', () => {
  let state = add(newProgress(), id, 'known');
  assert.equal(getComebackCount(state), 0);
  state = add(state, id, 'again', 'event-2');
  assert.deepEqual(getMissedQuestionIds(state), [id]);
});

test('weekly study days roll over Monday in Hong Kong and exclude future activity', () => {
  let state = add(newProgress(), id, 'known', 'sunday', '2026-09-20T15:59:00Z');
  state = add(state, id, 'known', 'monday', '2026-09-20T16:00:00Z');
  state = add(state, id, 'known', 'same-day', '2026-09-20T16:01:00Z');
  state = add(state, id, 'known', 'future', '2026-09-22T16:00:00Z');
  assert.equal(getWeeklySessionsCount(state, '2026-09-20T15:59:30Z'), 1);
  assert.equal(getWeeklySessionsCount(state, '2026-09-20T16:02:00Z'), 1);
  assert.equal(getWeeklySessionsCount(state, '2026-09-27T16:00:00Z'), 0);
});

test('corrupt storage, unsupported versions and unsafe records are safely discarded', () => {
  for (const raw of [null, '', '{', 'null', '[]', '{"version":2,"attempts":[]}']) assert.deepEqual(parseProgress(raw), newProgress());
  const safe = add(newProgress()).attempts[0];
  const restored = parseProgress(JSON.stringify({version:1, weeklyGoal:99, attempts:[safe, safe, {...safe,id:'__proto__'}, {...safe,id:'bad',questionId:'constructor'}, {...safe,id:'invalid-date',at:'no'}, {...safe,id:'wrong-bool',evidenceChecked:'yes'}]}));
  assert.deepEqual(restored, add(newProgress()));
  assert.equal(add(restored, '__proto__', 'known', 'different'), restored);
  assert.equal(add(restored, id, 'known', '__proto__'), restored);
});

test('goal changes and reset are deterministic without mutating previous state', () => {
  const initial = newProgress();
  const updated = setWeeklyGoal(initial, 7);
  assert.equal(initial.weeklyGoal, 3);
  assert.equal(updated.weeklyGoal, 7);
  assert.equal(setWeeklyGoal(updated, 0), updated);
  assert.equal(setWeeklyGoal(updated, 1.2), updated);
  assert.deepEqual(parseProgress(JSON.stringify(updated)), updated);
  assert.deepEqual(newProgress(), initial);
});

test('automatic attempts calculate results, persist responses, and cannot be submitted twice',async()=>{
 const {recordGradedAttempt,markEvidenceChecked,getCorrectQuestionCount}=await import('../lib/expedition.ts');
 let state=recordGradedAttempt(newProgress(),'q1-text-01','material remains',false,'graded-1',time);
 assert.equal(state.attempts.length,1);assert.equal(state.attempts[0].rating,'known');assert.equal(state.attempts[0].grading,'automatic');
 assert.equal(getCorrectQuestionCount(state),1);
 assert.equal(recordGradedAttempt(state,'q1-text-01','wrong',false,'graded-1',time),state);
 state=markEvidenceChecked(state,'graded-1',true);assert.equal(getEvidenceCheckedCount(state),1);assert.equal(state.attempts.length,1);
 assert.deepEqual(parseProgress(JSON.stringify(state)),state);
 const corrupted=JSON.parse(JSON.stringify(state));corrupted.attempts[0].response='not material remains';
 assert.equal(parseProgress(JSON.stringify(corrupted)).attempts[0].rating,'again');
});
test('skips go to review and later correct grades earn one comeback',async()=>{
 const {recordGradedAttempt,getCorrectQuestionCount}=await import('../lib/expedition.ts');
 let state=recordGradedAttempt(newProgress(),'q1-text-01','',true,'skip-1',time);
 assert.equal(state.attempts[0].rating,'again');assert.equal(getCorrectQuestionCount(state),0);
 state=recordGradedAttempt(state,'q1-text-01','physical remains',false,'retry-2',time);
 assert.equal(getComebackCount(state),1);assert.equal(getCorrectQuestionCount(state),1);
 assert.equal(recordGradedAttempt(state,'q1-text-01','',false,'empty',time),state);
 const mcq=questionBank.find(q=>q.format==='mcq');assert.equal(recordGradedAttempt(state,mcq.id,'not-a-choice',false,'bad-choice',time),state);
});


test('successive five-question rounds cover all unseen material before repeating',()=>{
 for(const mission of missions){
  let state=newProgress();const seen=new Set();
  for(let round=0;round<3;round++){
   const queue=selectMissionQuestions(state,mission.id,5,()=>.37);
   assert.equal(queue.length,5);assert.equal(new Set(queue).size,5);
   for(const id of queue){assert.ok(!seen.has(id));seen.add(id);state=recordAttempt(state,id,'known',false,`${mission.id}-${round}-${id}`,time);}
  }
  assert.equal(seen.size,mission.questionIds.length);
  assert.ok(selectMissionQuestions(state,mission.id).every(id=>seen.has(id)));
 }
});
test('rounds stay in lecture, preserve both formats when available, and prioritize missed after unseen',()=>{
 const mission=missions[0];const queue=selectMissionQuestions(newProgress(),mission.id,5,()=>.7);
 assert.deepEqual(new Set(queue.map(id=>questionBank.find(q=>q.id===id).format)),new Set(['mcq','blank']));
 let state=newProgress();mission.questionIds.forEach((id,i)=>{state=recordAttempt(state,id,i<5?'again':'known',false,`old-${i}`,time);});
 assert.ok(selectMissionQuestions(state,mission.id).every(id=>mission.questionIds.slice(0,5).includes(id)));
 assert.deepEqual(selectMissionQuestions(state,'unknown'),[]);assert.deepEqual(selectMissionQuestions(state,mission.id,0),[]);
 assert.equal(new Set(selectMissionQuestions(state,mission.id,100,()=>NaN)).size,15);
});
