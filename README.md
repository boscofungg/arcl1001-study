# Stratum (beta) — ARCL1001

Public study workspace for selected Lectures 1–3: a scrolling course reader,
source-grounded streaming tutor, generated flashcards and unified Quiz 1 practice.
The shared browser theme preference supports light and dark mode.

## Quiz 1 practice and flashcards

Choose a Lecture 1, 2 or 3 slide deck in the practice navigation. Practice has
35 slide-supported image-identification, map-labelling and concise-answer
questions; MCQs have been removed to follow the announced quiz formats.
Each suggested answer links only to its original lecture slide(s). Multi-part answers receive criterion-based automatic practice marking and
partial credit. Common paraphrases and explicitly authored numerical tolerances
are accepted; BCE/CE and elapsed-age units remain distinct. Every reveal shows
the exact slide-based model answer, accepted practice ranges and source links.
These are not official exam marks; unusual valid wording may still need review.

Flashcards also use only lecture slides. The API rejects PDF/web-reading source
requests; excerpt selection, validation, prepared fallback and saved-deck checks
all enforce Lecture sources. The practice/flashcard sidebar shows only the three
slide decks. PDF and web readings remain indexed and selectable in Read & ask,
and the chatbot can still answer questions about them.

Slide-only practice and flashcards use new browser-storage namespaces. Earlier
reading-based, mixed-source and MCQ sets remain archived in their previous keys,
but cannot reappear in the new review flow. Marked responses and results are saved per lecture in the current browser,
and are not sent to AI. Reveal-only questions earn no marks and go to review. No cross-device sync exists.

The former `/expeditions` URL redirects to `/?view=practice`.

## Development and hosting

Run `npm ci`, set server-only `GEMINI_API_KEY` and optional `GEMINI_MODEL` in
`.env.local`, then `npm run dev`. Verify with `npm run lint`, `npm test`,
`npm run build`, and `npx tsc --noEmit`. Course page originals are bundled for
visual model context. Practice marking is browser-local and make no AI requests.
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

## Slides-only revision

`checkpoint/pre-slides-only-quiz-2026-09-20` preserves the previous mixed-source
practice. `release/slides-only-quiz-2026-09-20` records this revision. Readings
remain available to the tutor; exclusion is specific to quiz and flashcard flows.

## Lenient slide marking

Checkpoint: `checkpoint/pre-lenient-slide-marking-2026-09-20`. Marked slide sets
use a new versioned browser key, preserving earlier self-check sets separately.
Tolerances are teaching aids authored for this app, not professor-approved limits.
