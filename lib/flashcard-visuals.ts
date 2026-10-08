import { slideQuestions } from './slide-practice.ts';
import type { Quiz1Question } from './quiz1-types.ts';
import documents from './documents.json' with { type: 'json' };
import type { Flashcard } from './flashcard-types.ts';

const questions = slideQuestions.filter((question): question is Quiz1Question & {image: NonNullable<Quiz1Question['image']>} =>
  (question.kind === 'image' || question.kind === 'map') && !!question.image && !question.additionalSources?.length,
);

/** Only reviewed, answer-hidden course images can become identification cards. */
export function visualFlashcardPool(week: number, docId?: string) {
  return questions.filter(question => question.image && documents.some(doc => doc.kind === 'Lecture' && doc.week === week && doc.id === question.source.docId && (!docId || doc.id === docId)));
}
export function visualFlashcardQuestion(card: Flashcard) {
  return questions.find(question => question.id === card.practiceQuestionId && question.question === card.question && question.answer === card.answer && question.source.docId === card.source.docId && question.source.page === card.source.page);
}
export function preparedVisualFlashcards(week: number, docId: string | undefined, count: number, random = Math.random): Flashcard[] {
  const pool = [...visualFlashcardPool(week, docId)];
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, count).map(question => ({ id: question.id, practiceQuestionId: question.id, question: question.question, answer: question.answer, evidence: question.evidence, source: question.source }));
}
