/**
 * Leitner-style spaced repetition for saved flashcard decks (browser-local).
 * "Known" moves a card up one box (longer gap); "Again" sends it back to box 0 (due now).
 */
import type { FlashcardDeck } from './flashcard-types.ts';

export const intervalsInDays = [0, 1, 3, 7, 14, 30] as const;
export type CardSchedule = { box: number; due: string };
export type Schedule = Record<string, CardSchedule>;
const day = 24 * 60 * 60 * 1000;

export const scheduleKey = (deckId: string, cardId: string) => `${deckId}:${cardId}`;

export function scheduleCard(schedule: Schedule, deckId: string, cardId: string, rating: 'again' | 'known', now = Date.now()): Schedule {
  const current = schedule[scheduleKey(deckId, cardId)];
  const box = rating === 'known' ? Math.min((current?.box ?? 0) + 1, intervalsInDays.length - 1) : 0;
  return { ...schedule, [scheduleKey(deckId, cardId)]: { box, due: new Date(now + intervalsInDays[box] * day).toISOString() } };
}

/** Cards rated before whose review date has arrived. Unrated cards are not "due"; they are new. */
export function dueCardIds(deck: FlashcardDeck, schedule: Schedule, now = Date.now()): string[] {
  return deck.cards.filter(card => {
    const entry = schedule[scheduleKey(deck.id, card.id)];
    return entry && Date.parse(entry.due) <= now;
  }).map(card => card.id);
}

export function nextDue(deck: FlashcardDeck, schedule: Schedule, now = Date.now()): Date | null {
  const times = deck.cards.map(card => schedule[scheduleKey(deck.id, card.id)]?.due).filter((due): due is string => !!due).map(Date.parse).filter(time => time > now);
  return times.length ? new Date(Math.min(...times)) : null;
}

export function parseSchedule(raw: string): Schedule {
  if (!raw || raw.length > 500000) return {};
  try {
    const value = JSON.parse(raw) as Schedule;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry && Number.isInteger(entry.box) && entry.box >= 0 && entry.box < intervalsInDays.length && !Number.isNaN(Date.parse(entry.due))));
  } catch {
    return {};
  }
}
