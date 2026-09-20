import {gradedQuestions, gradeAnswer} from './graded-questions.ts';

export type Rating = 'known' | 'again';
export type Attempt = { id: string; questionId: string; rating: Rating; evidenceChecked: boolean; at: string; response?:string; skipped?:boolean; grading?:'automatic' };
export type Progress = { version: 1; weeklyGoal: number; attempts: Attempt[] };
export type Mission = { id: string; title: string; subtitle: string; lecture: 1 | 2 | 3; questionIds: string[] };

export const missions: Mission[] = [
  { id: 'first-traces', title: 'First traces', subtitle: 'Read the clues left by people and their tools.', lecture: 1,
    questionIds: ['q1-text-01', 'visual-003', 'q1-text-04', 'q1-text-05', 'q1-text-15'] },
  { id: 'cities-rise', title: 'Cities rise', subtitle: 'Locate early cities and interpret their evidence.', lecture: 2,
    questionIds: ['visual-017', 'visual-004', 'q1-text-07', 'q1-text-08', 'q1-text-09'] },
  { id: 'power-and-evidence', title: 'Power and evidence', subtitle: 'Question what buildings, objects and burials can tell us.', lecture: 3,
    questionIds: ['visual-013', 'visual-008', 'q1-text-11', 'q1-text-16', 'q1-text-17'] },
];
export const questionBank = gradedQuestions;
const questionIds = new Set(questionBank.map(question => question.id));
const missionQuestionIds = new Set(missions.flatMap(mission => mission.questionIds));
const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value);

export function newProgress(): Progress { return { version: 1, weeklyGoal: 3, attempts: [] }; }

/** Persist only validated events. Unknown schema versions start a fresh local journal. */
export function parseProgress(raw: string | null): Progress {
  if (!raw || raw.length > 5_000_000) return newProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return newProgress();
    const candidate = value as Record<string, unknown>;
    if (candidate.version !== 1 || !Array.isArray(candidate.attempts)) return newProgress();
    const seen = new Set<string>();
    const attempts: Attempt[] = [];
    for (const item of candidate.attempts) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const row = item as Record<string, unknown>;
      if (!validId(row.id) || seen.has(row.id) || typeof row.questionId !== 'string' || !questionIds.has(row.questionId)
        || (row.rating !== 'again' && row.rating !== 'known') || typeof row.evidenceChecked !== 'boolean' || !validDate(row.at)) continue;
      seen.add(row.id);
      const base:Attempt={id:row.id,questionId:row.questionId,rating:row.rating,evidenceChecked:row.evidenceChecked,at:new Date(row.at).toISOString()};
      if(row.grading==='automatic'){
        if(typeof row.response!=='string'||row.response.length>160||typeof row.skipped!=='boolean')continue;
        const question=questionBank.find(q=>q.id===row.questionId)!;
        base.response=row.response;base.skipped=row.skipped;base.grading='automatic';
        base.rating=!row.skipped&&gradeAnswer(question,row.response).correct?'known':'again';
      }
      attempts.push(base);
    }
    return { version: 1, weeklyGoal: Number.isInteger(candidate.weeklyGoal) && Number(candidate.weeklyGoal) >= 1 && Number(candidate.weeklyGoal) <= 7 ? Number(candidate.weeklyGoal) : 3, attempts };
  } catch { return newProgress(); }
}

export function recordAttempt(state: Progress, questionId: string, rating: Rating, evidenceChecked: boolean, attemptId: string, nowISOString: string): Progress {
  if (!questionIds.has(questionId) || !validId(attemptId) || !validDate(nowISOString)
    || !['known', 'again'].includes(rating) || typeof evidenceChecked !== 'boolean' || state.attempts.some(attempt => attempt.id === attemptId)) return state;
  return { ...state, attempts: [...state.attempts, { id: attemptId, questionId, rating, evidenceChecked, at: new Date(nowISOString).toISOString() }] };
}

export function setWeeklyGoal(state: Progress, goal: number): Progress {
  return Number.isInteger(goal) && goal >= 1 && goal <= 7 ? { ...state, weeklyGoal: goal } : state;
}

export function getLatestAttempt(state: Progress, questionId: string): Attempt | undefined {
  return state.attempts.findLast(attempt => attempt.questionId === questionId);
}

export function getMissedQuestionIds(state: Progress): string[] {
  const latest = new Map<string, Rating>();
  for (const attempt of state.attempts) latest.set(attempt.questionId, attempt.rating);
  return [...latest].filter(([, rating]) => rating === 'again').map(([id]) => id);
}

export function missionProgress(state: Progress, missionId: string): { attempted: number; total: number; complete: boolean } {
  const mission = missions.find(item => item.id === missionId);
  if (!mission) return { attempted: 0, total: 0, complete: false };
  const attemptedIds = new Set(state.attempts.map(attempt => attempt.questionId));
  const attempted = mission.questionIds.filter(id => attemptedIds.has(id)).length;
  return { attempted, total: mission.questionIds.length, complete: attempted === mission.questionIds.length };
}

export function getCompletedMissionIds(state: Progress): string[] {
  return missions.filter(mission => missionProgress(state, mission.id).complete).map(mission => mission.id);
}

/** Each question can earn one comeback after an unsuccessful earlier attempt. */
export function getComebackCount(state: Progress): number {
  const missed = new Set<string>();
  const recovered = new Set<string>();
  for (const attempt of state.attempts) {
    if (attempt.rating === 'again') missed.add(attempt.questionId);
    else if (missed.has(attempt.questionId)) recovered.add(attempt.questionId);
  }
  return recovered.size;
}

function localDay(at: string): string {
  // HK course dates have a fixed UTC+08 offset and no daylight-saving transition.
  return new Date(Date.parse(at) + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function getWeeklySessionsCount(state: Progress, nowISOString: string): number {
  if (!validDate(nowISOString)) return 0;
  const today = localDay(nowISOString);
  const weekStart = new Date(today + 'T00:00:00Z');
  weekStart.setUTCDate(weekStart.getUTCDate() - (weekStart.getUTCDay() + 6) % 7);
  const start = weekStart.toISOString().slice(0, 10);
  return new Set(state.attempts.filter(attempt => Date.parse(attempt.at) <= Date.parse(nowISOString)).map(attempt => localDay(attempt.at)).filter(day => day >= start && day <= today)).size;
}

export function getEvidenceCheckedCount(state: Progress): number {
  return new Set(state.attempts.filter(attempt => attempt.evidenceChecked).map(attempt => attempt.questionId)).size;
}

export function getAttemptedQuestionCount(state: Progress): number {
  return new Set(state.attempts.filter(attempt => missionQuestionIds.has(attempt.questionId)).map(attempt => attempt.questionId)).size;
}

/** The result is calculated here; the UI cannot submit a self-awarded grade. */
export function recordGradedAttempt(state:Progress,questionId:string,response:string,skipped:boolean,attemptId:string,now:string):Progress {
  const question=questionBank.find(q=>q.id===questionId);
  if(!question||typeof response!=='string'||response.length>160||typeof skipped!=='boolean'||(!skipped&&!response.trim()))return state;
  if(!skipped&&question.format==='mcq'&&!question.options?.some(option=>option.id===response))return state;
  const correct=!skipped&&gradeAnswer(question,response).correct;
  const next=recordAttempt(state,questionId,correct?'known':'again',false,attemptId,now);
  if(next===state)return state;
  return {...next,attempts:next.attempts.map(attempt=>attempt.id===attemptId?{...attempt,response,skipped,grading:'automatic' as const}:attempt)};
}
export function markEvidenceChecked(state:Progress,attemptId:string,checked:boolean):Progress {
  if(typeof checked!=='boolean')return state;
  return {...state,attempts:state.attempts.map(attempt=>attempt.id===attemptId?{...attempt,evidenceChecked:checked}:attempt)};
}
export function getCorrectQuestionCount(state:Progress):number {
  return questionBank.filter(question=>{const latest=getLatestAttempt(state,question.id);return latest?.grading==='automatic'&&latest.rating==='known';}).length;
}
