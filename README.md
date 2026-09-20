# Stratum (beta) — ARCL1001

Public course study workspace for selected Lectures 1–3, with a scrolling
reader, source-grounded streaming tutor, generated flashcards, Quiz 1 practice,
and learning expeditions. Both the study pages and games support dark mode,
using one browser preference across the site.

## Use

Open `/` for readings and the tutor; choose **Expeditions** for `/expeditions`.
Three missions contain eight MCQs and seven short blanks, automatically marked
with course-specific equivalent phrases, spelling variants and limited typo
tolerance. Feedback distinguishes attempted questions, correct answers and
successful retries. Discovery completion is participation, not proof of mastery.
Game evidence can open the relevant page directly in the tutor.

Study and game progress is stored in the current browser. Nothing migrates
automatically from another hostname or device. Submitted game answers are saved
locally and can be exported/reset. Theme preference uses `stratum-theme`.
The former private-beta progress key is retained for compatibility, but no
administrator login or authentication code is present in this public build.

## Development

Run `npm ci`; configure server-only `GEMINI_API_KEY` and optional `GEMINI_MODEL`
in `.env.local`, then `npm run dev`. No API keys belong in client code or Git.
Run `npm run lint`, `npm test`, `npm run build`, and `npx tsc --noEmit`.
Course page originals are bundled into the chat function for visual reasoning.
Source data is public course content; model requests retain origin checks and
existing rate limits. These per-instance IP limits are not a measured capacity
or a coordinated whole-class quota. A class-sized load test remains separate.

## Hosting and rollback

Official project: `arcl1001-study`; production branch: `codex/study-workspace`.
Official domain: https://arcl1001-study-boscofungg.vercel.app/

The prior official release is backed up at `checkpoint/pre-public-games-2026-09-20`.
This single public-release commit is tagged `release/public-games-2026-09-20`.
To reverse it without rewriting history:

```sh
git fetch origin --tags
git revert release/public-games-2026-09-20
git push origin HEAD:codex/study-workspace
```

The former admin beta is archived in the private `arcl1001-field-journal-beta`
repository at `checkpoint/private-beta-complete-2026-09-20`; its separate
Vercel testing project is retired after this public release is verified.
Do not publish that historical private source without its authentication setup.

Question content and AI answers remain study aids rather than an official exam
paper or marking scheme. Web readings are labelled summaries with original links.
See `docs/student-feedback-quiz1.md` for suggested student feedback.
