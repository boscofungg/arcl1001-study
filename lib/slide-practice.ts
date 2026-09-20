import textQuestions from '../content/quiz1-question-bank.json' with { type: 'json' };
import visualQuestions from '../content/quiz1-visual-questions.json' with { type: 'json' };
import documents from './documents.json' with { type: 'json' };
import type { Quiz1Kind, Quiz1Question, Quiz1Source } from './quiz1-types.ts';

const lectures = new Map(documents.filter(doc => doc.kind === 'Lecture').map(doc => [doc.id, doc]));
const sourceExcerpts: Record<string, string> = {
  'd102:47': 'Provenience: where from; Matrix: soil/dirt; Association/ Assemblage: objects together',
  'd103:84': 'Erlitou: How did they live?; above ground house; semi-subterranean house',
  'd103:24': 'Mature Harappan Period (c.2600 - 1900 BCE)',
  'd103:96': 'Fu Hao’s Tomb; Ca 1200 BCE; consort of King Wu Ding',
  'd103:33': 'Anyang Period (c.1250 -1046 BCE)',
};

function validSlide(source: Quiz1Source): boolean {
  const document = lectures.get(source.docId);
  return !!document && Number.isInteger(source.page) && source.page >= 1 && source.page <= document.pages;
}

function slideEvidence(source: Quiz1Source, evidence = ''): string {
  // Coordinates describe the practice map illustration, not evidence on the lecture slide.
  return sourceExcerpts[`${source.docId}:${source.page}`] ?? evidence.split('Approximate coordinate source:')[0].trim();
}

export const slideQuestions: Quiz1Question[] = ([...textQuestions, ...visualQuestions] as Quiz1Question[])
  .filter(question => [question.source, ...(question.additionalSources ?? [])].every(validSlide))
  .map(question => ({
    ...question,
    ...(question.id==='visual-017'?{question:'Which site is marked A? Name the site and the region labelled on the lecture map.',answer:'Uruk (Warka), in Sumer.'}:{}),
    evidence: slideEvidence(question.source, question.evidence),
    additionalSources: question.additionalSources?.map(source => ({ ...source, evidence: slideEvidence(source, source.evidence) })),
  }));

export function getSlidePracticePool(lecture: 0 | 1 | 2 | 3 = 0, kind: Quiz1Kind | 'mixed' = 'mixed'): Quiz1Question[] {
  return slideQuestions.filter(question =>
    (kind === 'mixed' || question.kind === kind) &&
    (lecture === 0 || [question.source, ...(question.additionalSources ?? [])].every(source => lectures.get(source.docId)?.week === lecture)),
  );
}
