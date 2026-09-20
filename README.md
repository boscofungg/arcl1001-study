# Stratum (beta) — ARCL1001

Public study workspace for selected Lectures 1–3: a scrolling course reader,
source-grounded streaming tutor, generated flashcards and unified Quiz 1 practice.
The shared browser theme preference supports light and dark mode.

## Quiz 1 practice

Choose **Quiz 1 practice** in the main navigation, or open `/?view=practice`.
It contains all 45 automatically marked questions (23 MCQs and 22 short blanks).
Filter by lecture, format and question type, then start a five- or ten-question
set. Unseen questions are prioritized, followed by missed and previously correct
questions. Sets are capped by the available matching questions.

Answers receive explanations, source links and visual feedback. Blank marking
accepts curated equivalent wording, spelling variants and conservative typo
handling. These are unofficial study aids, not an exam marking scheme.

The separate Expeditions interface has been removed. `/expeditions` temporarily
redirects to Quiz 1 practice so previous links still work. Existing automatically
marked answers and in-progress sets are reused from the existing browser key;
older self-assessed Quiz 1 sets remain stored separately and are not turned into
automatic grades. Source reading opens inside the study workspace. Progress can
be exported or reset, but is not synchronized across devices or domains.

## Development and hosting

Run `npm ci`, set server-only `GEMINI_API_KEY` and optional `GEMINI_MODEL` in
`.env.local`, then `npm run dev`. Verify with `npm run lint`, `npm test`,
`npm run build`, and `npx tsc --noEmit`. Course page originals are bundled for
visual model context. Graded practice is browser-local and makes no AI requests.
Existing origin checks and per-instance IP rate limits remain on model APIs.
Whole-class AI capacity requires separate quota checks and load testing.

Official project: `arcl1001-study`; production branch: `codex/study-workspace`.
Official site: https://arcl1001-study-boscofungg.vercel.app/

## Backups

- Before public games: `checkpoint/pre-public-games-2026-09-20`.
- Before expanding to 45 questions: `checkpoint/pre-question-expansion-2026-09-20`.
- Before this consolidation: `checkpoint/pre-unified-quiz-practice-2026-09-20`.
- Consolidated release: `release/unified-quiz-practice-2026-09-20`.

To reverse this release, revert its tagged commit and push to the production
branch. Resolve conflicts if later edits depend on it; avoid force-pushing.
The former private testing site's source remains backed up in its private
repository, while its Vercel project has been retired.
