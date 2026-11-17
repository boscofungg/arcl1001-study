/** Personal per-slide notes, stored in this browser, with Markdown export and JSON backup/import. */
export type SlideNote = { text: string; updatedAt: string };
export type SlideNotes = Record<string, SlideNote>;
export const notesKey = 'stratum-slide-notes-v1';
const notesEvent = 'stratum-slide-notes-change';
export const noteKey = (docId: string, page: number) => `${docId}:${page}`;

export function parseNotes(raw: string): SlideNotes {
  if (!raw || raw.length > 2000000) return {};
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([key, value]) => /^d\d+:\d+$/.test(key) && value && typeof (value as SlideNote).text === 'string' && (value as SlideNote).text.length <= 5000 && !Number.isNaN(Date.parse((value as SlideNote).updatedAt)))) as SlideNotes;
  } catch {
    return {};
  }
}

export function rawNotes(): string {
  try { return localStorage.getItem(notesKey) || ''; } catch { return ''; }
}

export function subscribeNotes(listener: () => void): () => void {
  window.addEventListener('storage', listener);
  window.addEventListener(notesEvent, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(notesEvent, listener); };
}

export function setNote(notes: SlideNotes, docId: string, page: number, text: string, now = new Date()): SlideNotes {
  const next = { ...notes };
  if (text.trim()) next[noteKey(docId, page)] = { text: text.slice(0, 5000), updatedAt: now.toISOString() };
  else delete next[noteKey(docId, page)];
  return next;
}

export function saveNotes(notes: SlideNotes): boolean {
  let saved = true;
  try { localStorage.setItem(notesKey, JSON.stringify(notes)); } catch { saved = false; }
  window.dispatchEvent(new Event(notesEvent));
  return saved;
}

/** Imported notes win only when they are newer than the note already in this browser. */
export function mergeNotes(current: SlideNotes, imported: SlideNotes): SlideNotes {
  const next = { ...current };
  for (const [key, note] of Object.entries(imported)) if (!next[key] || Date.parse(note.updatedAt) > Date.parse(next[key].updatedAt)) next[key] = note;
  return next;
}

export function notesToMarkdown(notes: SlideNotes, titles: Record<string, { title: string; kind: string }>): string {
  const groups = new Map<string, [number, SlideNote][]>();
  for (const [key, note] of Object.entries(notes)) {
    const [docId, page] = key.split(':');
    groups.set(docId, [...(groups.get(docId) || []), [Number(page), note]]);
  }
  const lines = ['# My ARCL1001 slide notes', ''];
  for (const docId of [...groups.keys()].sort()) {
    const info = titles[docId];
    lines.push(`## ${info?.title || docId}`, '');
    for (const [page, note] of groups.get(docId)!.sort((a, b) => a[0] - b[0])) lines.push(`### ${info?.kind === 'Lecture' ? 'Slide' : 'Page'} ${page}`, '', note.text, '');
  }
  return lines.join('\n');
}
