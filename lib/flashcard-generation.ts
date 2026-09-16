import corpus from './corpus.json' with { type: 'json' };
import documents from './documents.json' with { type: 'json' };
import type { Flashcard } from './flashcard-types.ts';

type Document = { id: string; week: number; title: string; kind: string; pages: number };
type Passage = { docId: string; page: number; text: string };
export type FlashcardScope = { week: number; docId?: string; count: 6 | 10 };
export type FlashcardExcerpt = Flashcard['source'] & { citeId: string; text: string };
const normalize = (value: string) => value.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();

export function parseFlashcardScope(value: unknown, docs: Document[] = documents): FlashcardScope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose a valid week and card count.');
  const { week, docId, count } = value as Record<string, unknown>;
  if (typeof week !== 'number' || !Number.isInteger(week) || week < 2 || week > 7 || (count !== 6 && count !== 10)) throw new Error('Choose a week from 2 to 7 and either 6 or 10 cards.');
  if (docId !== undefined && (typeof docId !== 'string' || !docs.some(doc => doc.id === docId && doc.week === week))) throw new Error('Choose a document from the selected week.');
  return { week, count, ...(typeof docId === 'string' ? { docId } : {}) };
}

/** Keep excerpts within their original page and sample across the selected documents. */
export function selectFlashcardExcerpts(scope: FlashcardScope, passages: Passage[] = corpus, docs: Document[] = documents): FlashcardExcerpt[] {
  parseFlashcardScope(scope, docs);
  const selectedDocs = docs.filter(doc => doc.week === scope.week && (!scope.docId || doc.id === scope.docId) && !/\bdraft\b|quiz instructions|logistics/i.test(doc.title)).sort((a, b) => Number(b.kind === 'Lecture') - Number(a.kind === 'Lecture'));
  const groups = selectedDocs.map(doc => {
    const seen = new Set<number>();
    return passages.filter(passage => {
      if (passage.docId !== doc.id || !Number.isInteger(passage.page) || passage.page < 1 || passage.page > doc.pages || seen.has(passage.page)) return false;
      const text = passage.text.slice(0, 1800);
      if (text.length < 180 || (text.match(/[\p{L}\p{N}]+/gu) || []).length < 30 || /add locator map|quiz.*cover|quiz instructions|alternative table|to be added|table of contents|assessment deadline|submission deadline/i.test(text)) return false;
      seen.add(passage.page);
      return true;
    }).sort((a, b) => a.page - b.page).map(passage => ({ citeId: `${doc.id}-p${passage.page}`, docId: doc.id, page: passage.page, title: doc.title, label: `${doc.kind === 'Lecture' ? 'Slide' : 'Page'} ${passage.page}`, text: passage.text.slice(0, 1800) }));
  });
  // Lecture pages receive most of the budget; readings share the remainder.
  const result: FlashcardExcerpt[] = [];
  const takeSpaced = (items: FlashcardExcerpt[], count: number) => Array.from({ length: Math.min(count, items.length) }, (_, index) => items[Math.floor((index + .5) * items.length / Math.min(count, items.length))]);
  const lectureIndexes = selectedDocs.flatMap((doc, index) => doc.kind === 'Lecture' && groups[index].length ? [index] : []);
  if (scope.docId) return takeSpaced(groups[0] || [], 20);
  for (const index of lectureIndexes) result.push(...takeSpaced(groups[index], Math.max(1, Math.floor(14 / lectureIndexes.length))));
  const others = groups.filter((_, index) => !lectureIndexes.includes(index)).map(group => takeSpaced(group, 3));
  for (let round = 0; round < 3 && result.length < 20; round++) {
    for (const group of others) if (group[round] && result.length < 20) result.push(group[round]);
  }
  return result;
}

export function validateFlashcards(value: unknown, excerpts: FlashcardExcerpt[], count: number): Flashcard[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { cards?: unknown }).cards)) return [];
  const sources = new Map(excerpts.map(excerpt => [excerpt.citeId, excerpt]));
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
