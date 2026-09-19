import type { Quiz1Kind, Quiz1Question, Quiz1Review } from './quiz1-types.ts';
export const QUIZ1_STORAGE_KEY = 'quiz1practicev1';
export const quiz1KindLabels: Record<Quiz1Kind, string> = { image: 'Image identification', map: 'Map labelling', 'short-answer': 'Short answer', comparison: 'Comparison' };
export function makeQuiz1Set(bank: Quiz1Question[], kind: Quiz1Kind | 'mixed', count = 8, random: () => number = Math.random): Quiz1Review {
  const pool = [...new Map(bank.filter(q => kind === 'mixed' || q.kind === kind).map(q => [q.id, q])).values()];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.max(0, Math.min(.999999, random())) * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  // Mixed sets include every available format before filling the remaining spaces.
  const selected = kind === 'mixed' ? Object.keys(quiz1KindLabels).flatMap(type => pool.find(q => q.kind === type) || []) : [];
  for (const q of pool) if (!selected.some(s => s.id === q.id)) selected.push(q);
  return { version: 1, queue: selected.slice(0, Math.max(1, Math.min(30, Math.floor(count)))).map(q => q.id), position: 0, ratings: {}, startedAt: new Date().toISOString() };
}
export function rateQuiz1(review: Quiz1Review, rating: 'again' | 'known'): Quiz1Review {
  const id = review.queue[review.position];
  if (!id) return review;
  return { ...review, position: review.position + 1, ratings: { ...review.ratings, [id]: rating } };
}
export function retryQuiz1(review: Quiz1Review): Quiz1Review {
  return { ...review, queue: review.queue.filter(id => review.ratings[id] === 'again'), position: 0, ratings: {}, startedAt: new Date().toISOString() };
}
export function parseQuiz1Review(raw: string, bank: Quiz1Question[]): Quiz1Review | null {
  try {
    const value = JSON.parse(raw) as Quiz1Review;
    const ids = new Set(bank.map(q => q.id));
    if (!value || value.version !== 1 || !Array.isArray(value.queue) || value.queue.length > 30 || !value.queue.length || new Set(value.queue).size !== value.queue.length || !value.queue.every(id => typeof id === 'string' && ids.has(id)) || !Number.isInteger(value.position) || value.position < 0 || value.position > value.queue.length || typeof value.startedAt !== 'string' || !value.ratings || typeof value.ratings !== 'object' || Array.isArray(value.ratings)) return null;
    if (Object.entries(value.ratings).some(([id, rating]) => !value.queue.slice(0, value.position).includes(id) || !['again', 'known'].includes(rating)) || value.queue.slice(0, value.position).some(id => !value.ratings[id])) return null;
    return value;
  } catch { return null; }
}
