# Stratum — ARCL1001 study workspace

Interactive study browser and Gemini tutor for **Archaeology Around the Globe**.

## Run locally

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env`, then set the server-side Gemini key. Never put it in a `NEXT_PUBLIC_` variable. Hosted secrets are configured in Vercel environment variables. The production site is intended for direct student access without a ChatGPT account. The GitHub repository remains private.

## What is included

- Six weekly lecture views, course library, searchable document titles, and visual page reader.
- Course-grounded tutor with follow-up conversation, source scope, and clickable slide/page references.
- Guided review prompts and device-local review completion.
- 88 source documents: 6 lecture decks, 81 course PDFs, and the syllabus.
- Search index stays on the server; the browser receives the selected page text and original visual previews.

## Retrieval and limitations

`lib/retrieval.ts` ranks page-bounded passages using whole-word term frequency, inverse document frequency, passage length, and query coverage; it favors lectures, and limits repeated pages and sources. The top seven passages and up to four corresponding page previews are provided to Gemini with instructions to answer only from the evidence. Selecting “Ask about this page” pins the exact source page, including pages with no extractable text. Citations open the exact indexed page or slide. This is a working baseline, not an evaluated guarantee of correctness. The model can still misinterpret excerpts or cite a weak source.

`lib/ingestion-report.json` records coverage. All 4,018 source pages/slides have WebP previews, including 630 image-only or low-text pages. Gemini can inspect attached page visuals; five external URL shortcuts are not fetched. Scanned pages have visual coverage but no new OCR search index. There is no supplied lecture deck for Weeks 1 or 8–12. Some decks contain draft text; consult the original materials when text is unclear. PDF reading order and slide text are imperfect. Visual previews preserve source layout; LibreOffice renders slides, so animation stages, unusual fonts, and external media may differ from PowerPoint. Hidden slides are included to preserve original citation numbers.

To rebuild text from the original folder one level above this app, use a Python environment with PyMuPDF:

```sh
../.venv/bin/python scripts/ingest.py
```

Only the selected course passages, up to four original page previews, and recent conversation are sent to Google when a student asks a question. Chats are held in browser memory and clear on reload; only review completion is saved locally. The simple request limit is per process and is not a durable multi-instance quota.

## Verification

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
```

The source folder is isolated from the existing parent repository and its deleted files.

## Deploy on Vercel

This project uses standard Next.js for local development and Vercel deployment.
Set `GEMINI_API_KEY` as a sensitive production environment variable and
`GEMINI_MODEL=gemini-3.5-flash`. Neither variable uses the `NEXT_PUBLIC_` prefix.

```sh
npx vercel login
npx vercel link
npx vercel --prod
```

Use the production domain to share with students. Preview URLs may have Vercel
Authentication enabled; production access must be public to avoid a login prompt.
The chat function runs on Node.js with a 60-second maximum execution time.
Gemini requests use the server environment and never return its key.

## Original visuals

`scripts/ingest_visuals.py` rebuilds `public/materials/`, `lib/visuals.json`, and
`lib/visual-ingestion-report.json` from the original course folder. It uses
PyMuPDF/Pillow and LibreOffice (for full PowerPoint rendering), includes hidden
slides, checks every page count, and preserves embedded figures, graphs, tables,
maps, labels, and photographs. Previews are 1400px WebP at quality 65; the original
files are not modified. Native chart/table text is included when available.

Visual assets are served as static files, not bundled in the chat function.
Use the existing Git-based Vercel deployment for this approximately 404MiB visual
library; it exceeds the Hobby CLI source-upload limit. No additional runtime
package or storage service is required. In production, the chat function reads
at most four images from the project's public production domain and sends their
bytes to Gemini. Failed image loads are reported instead of pretending a visual
was inspected. AI descriptions may still be wrong; check labels and values in
the original preview, using zoom or Open image.

## Streaming replies

The browser requests `stream:true` from `/api/chat`. The API immediately sends
source metadata and progress events, then forwards Gemini answer text as real
server-sent events. Citations work while the answer is arriving. Stop aborts the
request and upstream work; partial answers are retained with an interruption
notice and are excluded from later conversation context. Non-streaming JSON
requests remain supported for older clients.

Gemini 3 models use LOW thinking effort to reduce startup latency. Source
visuals and grounding rules are preserved. A per-process 16MiB / 32-image cache
keeps recently used public previews for 10 minutes; this helps warm repeat
requests, not cold starts. Streaming improves time to visible text; model and
network latency still vary.

## Appearance

Use the sun/moon button in the top bar to switch light and dark mode. The initial
theme follows the device setting; an explicit choice is saved on the device and
synchronized between tabs. Course page images retain their original colors.
