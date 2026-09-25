import l4Questions from '../content/l4-practice.json' with {type:'json'};
import reviewedQuestions from '../content/quiz1-question-bank.json' with { type: 'json' };
import type { Quiz1Question } from './quiz1-types.ts';
import corpus from './corpus.json' with { type: 'json' };
import documents from './documents.json' with { type: 'json' };
import type { Flashcard } from './flashcard-types.ts';

type Document = { id: string; week: number; title: string; kind: string; pages: number; startPage?: number; isSummary?: boolean };
type Passage = { docId: string; page: number; text: string };
export type FlashcardScope = { week: number; docId?: string; count: 6 | 10 };
export type FlashcardExcerpt = Flashcard['source'] & { citeId: string; text: string };
const normalize = (value: string) => value.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();

export function parseFlashcardScope(value: unknown, docs: Document[] = documents): FlashcardScope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose a valid week and card count.');
  const { week, docId, count } = value as Record<string, unknown>;
  if (typeof week !== 'number' || !Number.isInteger(week) || !docs.some(doc=>doc.kind==='Lecture'&&doc.week===week) || (count !== 6 && count !== 10)) throw new Error('Choose an available lecture and either 6 or 10 cards.');
  if (docId !== undefined && (typeof docId !== 'string' || !docs.some(doc => doc.id === docId && doc.week === week && doc.kind === 'Lecture'))) throw new Error('Choose lecture slides from the selected lecture.');
  return { week, count, ...(typeof docId === 'string' ? { docId } : {}) };
}

/** Keep excerpts within their original page and sample across the selected documents. */
export function selectFlashcardExcerpts(scope: FlashcardScope, passages: Passage[] = corpus, docs: Document[] = documents): FlashcardExcerpt[] {
  parseFlashcardScope(scope, docs);
  const selectedDocs = docs.filter(doc => doc.kind === 'Lecture' && doc.week === scope.week && (!scope.docId || doc.id === scope.docId) && !/\bdraft\b|quiz instructions|logistics/i.test(doc.title));
  const groups = selectedDocs.map(doc => {
    const pages = new Map<number, string[]>();
    for (const passage of passages) {
      if (passage.docId !== doc.id || !Number.isInteger(passage.page) || passage.page < (doc.startPage || 1) || passage.page > doc.pages) continue;
      const blocks = pages.get(passage.page) || [];
      if (passage.text.trim() && !blocks.includes(passage.text)) blocks.push(passage.text);
      pages.set(passage.page, blocks);
    }
    return [...pages].sort(([a], [b]) => a - b).flatMap(([page, blocks]) => {
      const text = blocks.join('\n\n').slice(0, 1800);
      if (text.length < 80 || (text.match(/[\p{L}\p{N}]+/gu) || []).length < 10 || /add locator map|quiz.*cover|quiz instructions|alternative table|to be added|table of contents|assessment deadline|submission deadline/i.test(text)) return [];
      return [{ citeId: `${doc.id}-p${page}`, docId: doc.id, page, title: doc.title, label: `Slide ${page}`, text }];
    });
  });
  const result: FlashcardExcerpt[] = [];
  const takeSpaced = (items: FlashcardExcerpt[], count: number) => Array.from({ length: Math.min(count, items.length) }, (_, index) => items[Math.floor((index + .5) * items.length / Math.min(count, items.length))]);
  const populated = groups.filter(group => group.length);
  for (const group of populated) result.push(...takeSpaced(group, Math.max(1, Math.floor(20 / populated.length))));
  return result;
}

export function validateFlashcards(value: unknown, excerpts: FlashcardExcerpt[], count: number): Flashcard[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { cards?: unknown }).cards)) return [];
  const sources = new Map(excerpts.filter(excerpt => documents.some(doc => doc.id === excerpt.docId && doc.kind === 'Lecture')).map(excerpt => [excerpt.citeId, excerpt]));
  const questions = new Set<string>();
  const cards: Flashcard[] = [];
  const bounded = (value: unknown, min: number, max: number): value is string => typeof value === 'string' && value.trim().length >= min && value.length <= max;
  for (const candidate of (value as { cards: unknown[] }).cards.slice(0, 30)) {
    if (!candidate || typeof candidate !== 'object') continue;
    const { question, answer, evidence, citeId } = candidate as Record<string, unknown>;
    if (!bounded(question, 12, 350) || !bounded(answer, 10, 1200) || !bounded(evidence, 20, 900) || typeof citeId !== 'string') continue;
    const source = sources.get(citeId);
    const key = normalize(question).replace(/[^\p{L}\p{N}]/gu, '');
    if (!source || !normalize(source.text).includes(normalize(evidence)) || questions.has(key)) continue;
    if (normalize(question).includes(normalize(answer))) continue;
    // No image was sent to the model: questions must stand on the supplied text.
    if (/\b(this|shown|pictured|above|below|attached)\b.{0,25}\b(image|figure|graph|photograph|map|diagram)\b|\b(image|figure|graph|photograph|map|diagram)\b.{0,25}\b(shown|above|below|attached)\b/i.test(question)) continue;
    questions.add(key);
    cards.push({ id: `card-${cards.length + 1}`, question: question.trim(), answer: answer.trim(), evidence: evidence.trim(), source: { docId: source.docId, page: source.page, title: source.title, label: source.label } });
    if (cards.length >= count) break;
  }
  return cards;
}

export function flashcardSchema(excerpts: FlashcardExcerpt[], count: number) {
  return { type: 'object', properties: { cards: { type: 'array', minItems: count, maxItems: count, items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' }, evidence: { type: 'string' }, citeId: { type: 'string', enum: excerpts.map(excerpt => excerpt.citeId) } }, required: ['question', 'answer', 'evidence', 'citeId'], additionalProperties: false } } }, required: ['cards'], additionalProperties: false };
}

/** Sparse slide excerpts cannot support a full ten-card set without repetitive trivia. */
export function flashcardTargetCount(excerpts: FlashcardExcerpt[], requested: 6 | 10): number {
  const words = excerpts.reduce((sum, excerpt) => sum + (excerpt.text.match(/[\p{L}\p{N}]+/gu) || []).length, 0);
  return Math.min(requested, words < 180 ? 3 : words < 350 ? 6 : 10);
}

/** Reviewed text questions remain useful when generation is unavailable. Never widen scope. */
export function reviewedFlashcardFallback(scope: FlashcardScope, bank: Quiz1Question[] = [...reviewedQuestions,...l4Questions] as Quiz1Question[], docs: Document[] = documents): Flashcard[] {
  parseFlashcardScope(scope, docs);
  const seen = new Set<string>();
  return bank.flatMap(question => {
    const source = question.source;
    const doc = docs.find(item => item.id === source?.docId);
    if (question.kind !== 'short-answer' || question.additionalSources?.length || !doc || doc.kind !== 'Lecture' || doc.week !== scope.week || (scope.docId && doc.id !== scope.docId) || !Number.isInteger(source.page) || source.page < (doc.startPage || 1) || source.page > doc.pages || !question.evidence?.trim() || !question.question?.trim() || !question.answer?.trim() || seen.has(question.id)) return [];
    seen.add(question.id);
    return [{ id: question.id, question: question.question, answer: question.answer, evidence: question.evidence, source: { docId: doc.id, page: source.page, title: doc.title, label: `Slide ${source.page}` } }];
  }).slice(0, scope.count);
}
