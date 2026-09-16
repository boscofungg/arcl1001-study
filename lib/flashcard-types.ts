export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  evidence: string;
  source: { docId: string; page: number; title: string; label: string };
};

export type FlashcardDeck = {
  id: string;
  week: number;
  docId?: string;
  title: string;
  createdAt: string;
  cards: Flashcard[];
};
