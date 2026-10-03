import { parseReview, type FlashcardReview } from './flashcard-review.ts';

export const MAX_SAVED_DECKS = 40;
export type FlashcardLibrary = { version: 1; week: number; selectedId: string | null; reviews: FlashcardReview[] };
export function emptyLibrary(week: number): FlashcardLibrary {
  return { version: 1, week, selectedId: null, reviews: [] };
}
export function parseLibrary(raw: string, week: number): FlashcardLibrary | null {
  if (!raw || raw.length > 6000000) return null;
  try {
    const value = JSON.parse(raw) as FlashcardLibrary;
    if (value.version !== 1 || value.week !== week || !Array.isArray(value.reviews) || value.reviews.length > MAX_SAVED_DECKS) return null;
    if (value.reviews.some(review => !parseReview(JSON.stringify(review)) || review.deck.week !== week)) return null;
    const ids = new Set(value.reviews.map(review => review.deck.id));
    if (ids.size !== value.reviews.length || (value.selectedId !== null && !ids.has(value.selectedId)) || (ids.size > 0 && value.selectedId === null)) return null;
    return value;
  } catch { return null; }
}
export function restoreLibrary(raw: string, legacy: string, week: number): FlashcardLibrary {
  const library = parseLibrary(raw, week);
  if (library) return library;
  const review = parseReview(legacy);
  return review?.deck.week === week ? { version: 1, week, selectedId: review.deck.id, reviews: [review] } : emptyLibrary(week);
}
export function saveLibraryReview(library: FlashcardLibrary, review: FlashcardReview): FlashcardLibrary {
  if (review.deck.week !== library.week || !parseReview(JSON.stringify(review))) throw new Error('This deck is not valid for these lecture slides.');
  const exists = library.reviews.some(item => item.deck.id === review.deck.id);
  if (!exists && library.reviews.length >= MAX_SAVED_DECKS) throw new Error(`Your library holds ${MAX_SAVED_DECKS} sets. Download a backup and delete a set before adding another.`);
  return { ...library, selectedId: review.deck.id, reviews: exists ? library.reviews.map(item => item.deck.id === review.deck.id ? review : item) : [...library.reviews, review] };
}
export function deleteLibraryReview(library: FlashcardLibrary, id: string): FlashcardLibrary {
  const reviews = library.reviews.filter(review => review.deck.id !== id);
  return { ...library, reviews, selectedId: library.selectedId === id ? reviews.at(-1)?.deck.id ?? null : library.selectedId };
}
export function mergeLibrary(library: FlashcardLibrary, imported: FlashcardLibrary): FlashcardLibrary {
  if (library.week !== imported.week) throw new Error('Choose a backup for this lecture.');
  // Keep local progress when the same deck already exists.
  const ids = new Set(library.reviews.map(review => review.deck.id));
  const reviews = [...library.reviews, ...imported.reviews.filter(review => !ids.has(review.deck.id))];
  if (reviews.length > MAX_SAVED_DECKS) throw new Error(`Import would exceed ${MAX_SAVED_DECKS} saved sets. No sets were changed.`);
  return { ...library, reviews, selectedId: library.selectedId ?? imported.selectedId };
}
