/** Study scopes shared by the sidebar, tutor and chat API. */
export type CourseScope = 'all' | 'quiz2' | 'quiz3';
export const courseScopes: Record<CourseScope, { label: string; short: string; weeks: readonly number[] | null }> = {
  all: { label: 'All lectures · 1–11', short: 'L1–11', weeks: null },
  quiz2: { label: 'Quiz 2 · Lectures 4–7', short: 'L4–7', weeks: [4, 5, 6, 7] },
  quiz3: { label: 'Quiz 3 · Lectures 8–11', short: 'L8–11', weeks: [8, 9, 10, 11] },
};
export const isQuizScope = (value: unknown): value is 'quiz2' | 'quiz3' => value === 'quiz2' || value === 'quiz3';
export const inScope = (scope: CourseScope, week: number) => !courseScopes[scope].weeks || courseScopes[scope].weeks!.includes(week);
