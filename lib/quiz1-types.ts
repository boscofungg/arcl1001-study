export type Quiz1Kind = 'image' | 'map' | 'short-answer' | 'comparison';
export type Quiz1Source = { docId: string; page: number; title: string; label: string; evidence?: string };
export type Quiz1Question = {
  id: string; kind: Quiz1Kind; question: string; answer: string; evidence: string;
  source: Quiz1Source; additionalSources?: Quiz1Source[];
  image?: { src: string; width: number; height: number; alt: string };
  acceptedAnswers?: string[];
};
export type Quiz1Review = { version: 1; queue: string[]; position: number; ratings: Record<string, 'again' | 'known'>; startedAt: string };
