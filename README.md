# Stratum (beta) — ARCL1001

Study workspace for ARCL1001 Lectures 1–9 and their assigned readings:

- **Read & ask** — a scrolling reader for slides and readings, with a streaming tutor that
  answers only from the course materials and cites the slide or page it used.
- **General practice** — slide-based image, map and short-answer questions with automatic
  practice marking, plus full mock papers (currently Quiz 2 format, Lectures 4–7).
- **Make flashcards** — generated or prepared cards from lecture slides, with spaced review.

Live site: https://arcl1001-study-boscofungg.vercel.app/ · Release history: [CHANGELOG.md](CHANGELOG.md)

## How it works

```
course files ──(scripts/ingest*.py, run locally)──▶ lib/corpus.json, lib/visuals.json, public/materials/*.webp
content/*.json (hand-authored questions, rubrics, mock papers) ─┐
                                                                ▼
                         Next.js app on Vercel ── /api/chat ───────▶ HKU Claude (Converse / ConverseStream)
                                               ── /api/flashcards ─▶ HKU Claude, then validated against slides
                                               ── /api/source  (page text and images)
browser ── progress, decks, mock-paper drafts, flashcard schedule in localStorage (no accounts, no sync)
```

- Retrieval (`lib/retrieval.ts`) is lexical BM25-style scoring with a few aliases; the tutor
  receives the top 7 passages plus up to 4 original slide images.
- The tutor prompt lives in `lib/tutor-prompt.ts`. Short follow-ups reuse the previous
  question for search (`lib/followup.ts`).
- Practice and flashcards use **lecture slides only**; readings are available to the tutor.
- Practice marks are study aids, not official assessment marks.

## Development

Requirements: Node 24.

```bash
npm ci
cp .env.example .env.local   # set HKU_CLAUDE_KEY (server-only); HKU_CLAUDE_MODEL is optional
npm run dev
```

Checks (also run by GitHub Actions on every push and pull request):

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
```

`tests/retrieval-eval.test.mjs` measures whether search finds supporting evidence for the
questions in `tests/eval/retrieval-cases.json`. Add a case whenever students report a missed topic.

## Operating procedures

- Adding or replacing course materials: [docs/ingest.md](docs/ingest.md)
- Releasing and rolling back: [docs/release.md](docs/release.md)
- Student feedback loop: [docs/continuous-improvement-log.md](docs/continuous-improvement-log.md)
- Work that needs new accounts or keys: [docs/pending-external.md](docs/pending-external.md)

## Security and licensing notes

- Course slides and readings are licensed to HKU students. The site sends `noindex` to
  search engines, but the materials are not behind a login. Keep this repository private.
- The HKU key is server-only and is never logged; the provider puts it in the request URL,
  so server logs redact URLs and keys (`lib/server-log.ts`).
- Model routes accept requests only from the study page and are rate-limited per IP
  (12 questions, 4 flashcard decks per minute). The limit is per server instance.
