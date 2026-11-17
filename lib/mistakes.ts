/**
 * Mistake book (browser-local). Wrong answers from lecture practice and mock papers are
 * collected here, come back for re-answering (1, 3, then 7 days after a correct retry),
 * and can be exported. Nothing is sent to a server.
 */
export type MistakeSource = { docId: string; page: number; title: string; label: string; evidence?: string };
export type MistakeImage = { src: string; width: number; height: number; alt: string };
export type Mistake = {
  id: string;
  origin: 'practice' | 'mock';
  questionId: string;
  week: number;
  kind: string;
  prompt: string;
  modelAnswer: string;
  checklist?: string[];
  yourAnswer: string;
  images?: MistakeImage[];
  sources: MistakeSource[];
  paperId?: number;
  addedAt: string;
  dueAt: string;
  box: number;
  attempts: number;
  lastAnswer?: string;
  resolvedAt?: string;
};
export type MistakeBook = { version: 1; items: Mistake[] };
export type NewMistake = Omit<Mistake, 'id' | 'addedAt' | 'dueAt' | 'box' | 'attempts' | 'resolvedAt' | 'lastAnswer'>;

export const mistakesKey = 'stratum-mistakes-v1';
export const mistakeEvent = 'stratum-mistakes-change';
const day = 86400000;
const retryGaps = [1, 3, 7];
export const emptyBook: MistakeBook = { version: 1, items: [] };

export const mistakeId = (origin: Mistake['origin'], questionId: string) => `${origin}:${questionId}`;

export function addMistake(book: MistakeBook, entry: NewMistake, now = Date.now()): MistakeBook {
  const id = mistakeId(entry.origin, entry.questionId);
  const stamp = new Date(now).toISOString();
  const existing = book.items.find(item => item.id === id);
  const next: Mistake = existing
    ? { ...existing, ...entry, id, dueAt: stamp, box: 0, resolvedAt: undefined }
    : { ...entry, id, addedAt: stamp, dueAt: stamp, box: 0, attempts: 0 };
  return { version: 1, items: [next, ...book.items.filter(item => item.id !== id)].slice(0, 300) };
}

export function removeMistake(book: MistakeBook, id: string): MistakeBook {
  return { version: 1, items: book.items.filter(item => item.id !== id) };
}

/** Record a re-answer. Three correct retries in a row (spaced 1, 3, 7 days) resolve it. */
export function recordRetry(book: MistakeBook, id: string, correct: boolean, answer: string, now = Date.now()): MistakeBook {
  return {
    version: 1,
    items: book.items.map(item => {
      if (item.id !== id) return item;
      const box = correct ? item.box + 1 : 0;
      const resolved = correct && box >= retryGaps.length;
      return {
        ...item, box, attempts: item.attempts + 1, lastAnswer: answer.slice(0, 2000),
        dueAt: new Date(now + (correct ? retryGaps[Math.min(box, retryGaps.length) - 1] * day : 0)).toISOString(),
        resolvedAt: resolved ? new Date(now).toISOString() : undefined,
      };
    }),
  };
}

export const openMistakes = (book: MistakeBook) => book.items.filter(item => !item.resolvedAt);
export const dueMistakes = (book: MistakeBook, now = Date.now()) => openMistakes(book).filter(item => Date.parse(item.dueAt) <= now);

export function parseMistakeBook(raw: string): MistakeBook {
  if (!raw || raw.length > 3000000) return emptyBook;
  try {
    const data = JSON.parse(raw) as MistakeBook;
    if (data?.version !== 1 || !Array.isArray(data.items)) return emptyBook;
    const items = data.items.filter(item => item && typeof item.id === 'string' && ['practice', 'mock'].includes(item.origin)
      && typeof item.questionId === 'string' && typeof item.prompt === 'string' && typeof item.modelAnswer === 'string'
      && typeof item.yourAnswer === 'string' && Number.isInteger(item.week) && Array.isArray(item.sources)
      && !Number.isNaN(Date.parse(item.dueAt)) && Number.isInteger(item.box) && Number.isInteger(item.attempts));
    return { version: 1, items };
  } catch {
    return emptyBook;
  }
}

export function readMistakeBook(): MistakeBook {
  try { return parseMistakeBook(localStorage.getItem(mistakesKey) || ''); } catch { return emptyBook; }
}

export function saveMistakeBook(book: MistakeBook): void {
  try { localStorage.setItem(mistakesKey, JSON.stringify(book)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(mistakeEvent));
}

export function subscribeMistakes(listener: () => void): () => void {
  window.addEventListener('storage', listener);
  window.addEventListener(mistakeEvent, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(mistakeEvent, listener); };
}

export function rawMistakes(): string {
  try { return localStorage.getItem(mistakesKey) || ''; } catch { return ''; }
}

const cell = (value: string) => `"${value.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

export function mistakesToCsv(book: MistakeBook): string {
  const header = ['Lecture', 'Origin', 'Question', 'Your answer', 'Model answer', 'Source slides', 'Status', 'Added'];
  const rows = book.items.map(item => [
    `L${item.week}`, item.origin === 'mock' ? `Mock paper ${item.paperId ?? ''}`.trim() : 'Lecture practice', item.prompt, item.lastAnswer || item.yourAnswer,
    item.modelAnswer, item.sources.map(source => `${source.title} ${source.label}`).join('; '), item.resolvedAt ? 'Resolved' : 'To review', item.addedAt.slice(0, 10),
  ]);
  return [header, ...rows].map(row => row.map(cell).join(',')).join('\n');
}

export function mistakesToMarkdown(book: MistakeBook): string {
  const lines = ['# My ARCL1001 mistakes', '', `Exported ${new Date().toISOString().slice(0, 10)} from Stratum. ${openMistakes(book).length} to review.`, ''];
  for (const item of book.items) {
    lines.push(`## L${item.week} · ${item.prompt.slice(0, 120)}${item.resolvedAt ? ' (resolved)' : ''}`, '');
    lines.push(`- **Your answer:** ${item.lastAnswer || item.yourAnswer || '(blank)'}`);
    lines.push(`- **Model answer:** ${item.modelAnswer}`);
    if (item.checklist?.length) lines.push(`- **Check for:** ${item.checklist.join('; ')}`);
    lines.push(`- **Slides:** ${item.sources.map(source => `${source.title}, ${source.label}`).join('; ')}`, '');
  }
  return lines.join('\n');
}
