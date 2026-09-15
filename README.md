# Stratum — ARCL1001 study workspace

Interactive study browser and Gemini tutor for **Archaeology Around the Globe**.

## Run locally

```sh
npm run install:ci
npm run dev
```

Copy `.env.example` to `.env`, then set the server-side Gemini key. Never put it in a `NEXT_PUBLIC_` variable. Hosted secrets are configured through Sites. The private deployment is owner-only; sharing with classmates requires a deliberate access change and a production abuse-control review.

## What is included

- Six weekly lecture views, course library, searchable document titles, and extracted-text reader.
- Course-grounded tutor with follow-up conversation, source scope, and clickable slide/page references.
- Guided review prompts and device-local review completion.
- 88 source documents: 6 lecture decks, 81 course PDFs, and the syllabus.
- Full-text extraction stays on the server; browser receives selected documents and passages only.

## Retrieval and limitations

`lib/retrieval.ts` ranks page-bounded passages using whole-word term frequency, inverse document frequency, passage length, and query coverage; it favors lectures, and limits repeated pages and sources. The top seven passages are provided to Gemini with instructions to answer only from the evidence. Citations open the exact indexed page or slide. This is a working baseline, not an evaluated guarantee of correctness. The model can still misinterpret excerpts or cite a weak source.

`lib/ingestion-report.json` records coverage. Scanned pages, images, diagrams, and five external URL shortcuts are not interpreted. There is no supplied lecture deck for Weeks 1 or 8–12. Some decks contain draft text; consult the original materials when text is unclear. PDF reading order and slide text are imperfect, and diagrams should be checked in the originals.

To rebuild text from the original folder one level above this app, use a Python environment with PyMuPDF:

```sh
../.venv/bin/python scripts/ingest.py
```

Only the necessary course passages and recent conversation are sent to Google when a student asks a question. Chats are held in browser memory and clear on reload; only review completion is saved locally. The simple request limit is per process and is not a durable multi-instance quota.

## Verification

```sh
npm run lint
npx tsc --noEmit
node --experimental-strip-types --test tests/retrieval.test.mjs
npm run build
```

The source folder is isolated from the existing parent repository and its deleted files.
