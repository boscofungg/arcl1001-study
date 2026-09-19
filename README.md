# Stratum — ARCL1001 Quiz 1 revision

A focused reading-and-tutor workspace for the selected **Lecture 1–3** materials.

## Student workflow

- **Read & ask:** scroll through original pages beside the tutor. Ask across lectures, regions and periods. Citations jump to the correct page and highlight the retrieved passage using real source geometry.
- **Quiz 1 practice:** prepared image-identification, map-labelling, short-answer and comparison cards. Try your answer, reveal source evidence, and revisit missed cards. These are study aids, not the official paper.
- **Make flashcards:** generate concise short-answer cards from a selected Quiz 1 source. Exact source references and evidence quotations are checked; unsupported cards are removed. When possible, prepared source-matched cards replace failed AI generation and are labelled accordingly.

There are nine selected documents: three new lecture decks, three PDF readings and three linked web-reading summaries. Original slide numbering is preserved, including hidden slides. Reading front matter remains viewable but does not enter study retrieval. Web summaries link to the full publisher articles and are not represented as complete articles.

## Run

Node.js 24 is required.

```sh
npm ci
# Copy .env.example to .env and set the server-side key.
npm run dev
```

`GEMINI_API_KEY` and `GEMINI_MODEL` are server-only environment variables. They must not use a `NEXT_PUBLIC_` prefix. Vercel stores the production secrets. The previously prepared HKU Claude migration is not part of this release.

## Verify

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
```

The tests cover current source scope, citation and image boundaries, cross-lecture retrieval, stream parsing, practice selection and review state, and exact citation highlighting.

## Content generation

`scripts/rebuild-quiz1.py` ingests the explicitly supplied source files using PyMuPDF/Pillow and LibreOffice, and records hashes in `content/quiz1-source-manifest.json`. It renders originals rather than generating substitute figures. `scripts/build-quiz1-questions.py` recreates the neutral-named practice image/map assets from source evidence. Keep original files outside the public directory.

Prepared practice requires no AI request. Tutor replies stream when supported by the provider, cache recently used page images and preserve source citations. Flashcard and practice progress, along with the theme preference, are stored on the student's device; chats remain in memory. The app adds no feedback analytics or student account fields.

## Limits

AI answers and generated cards still require source checking. A valid citation does not prove every conclusion is correct. Static PowerPoint previews may differ in animation stages or fonts; scanned text can remain incomplete. Maps use approximate locations. The actual Quiz 1 question count, marking scheme and duration were not supplied, so the app does not invent them.

## Deployment, rollback and student feedback

GitHub pushes to `codex/study-workspace` trigger Vercel production deployment. See:

- [Release scope, verification and rollback](docs/quiz1-release.md)
- [Student-feedback questions and pilot tasks](docs/student-feedback-quiz1.md)

The pre-revision source is preserved in the GitHub tag `checkpoint/pre-quiz1-2026-09-19` and in the original local checkout. Keep that checkpoint until the Quiz 1 trial has been reviewed.
