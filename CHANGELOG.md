# Changelog

Release history for Stratum (ARCL1001), newest first. Entries before November 2026 were
moved here unchanged from the old README. New releases should also be published as
GitHub Releases from their `release/…` tag (see `docs/release.md`).

## Lecture 11 slides (18 November 2026)

- **New material:** Lecture 11 slides, *Production and Trade in Africa* (65 slides, d131, rendered
  via PowerPoint PDF export; 48 slides carry searchable text). The document viewer now opens on it.
- **Timeline & links:** Essouk-Tadmekka (c. 750–1400 CE) and Phalaborwa (c. 200–1900 CE), plus
  two method cards (studying trade networks; chaîne opératoire), each citing its slide.
- **Retrieval checks:** four Lecture 11 cases (Tadmekka, Phalaborwa, chaîne opératoire,
  trans-Saharan trade).
- **Quiz 3 mock paper (Lectures 8–11):** Mock papers now switch between Quiz 3 (default) and
  Quiz 2, each with its own saved papers. The Quiz 3 bank has 8 image options (2–3 unlabelled views
  each: Arzhan 2, Botai, Borobudur, Angkor Wat, Cahokia, Fort Michilimackinac, Essouk-Tadmekka,
  Phalaborwa), 4 concept, 4 significance and 4 discussion questions, and 10 map targets. Every paper
  covers all four lectures; every model answer cites slide text checked by `tests/quiz3-mock-paper.test.mjs`.

## Student feedback 13/11 and Quiz 3 (17 November 2026)

- **New materials:** Lecture 10 slides (111, rendered via PowerPoint PDF export), the Lecture 10
  reading (Smithsonian NMAI framework) and the Lecture 11 reading (Chirikure 2017). Lecture 11
  slides have not been supplied yet.
- **Quiz 3 scope (Lectures 8–11)** in the sidebar, tutor and chat API, alongside Quiz 2 and All 1–11.
- **Mock papers** are now the main practice tab. Image options show 2–3 views of the same site
  where the slides have them (7 of 8 options), as in the real quiz.
- **Mistakes & review** replaces Quick practice: wrong or revealed practice answers, wrong
  chronology answers and anything marked “I got this wrong” in a mock paper are collected, come
  back after 1, 3 and 7 days until answered correctly three times, and export to Markdown or CSV.
  After a mock paper, “Re-answer my mistakes” jumps straight there. Lecture practice sits below.
- **Flashcards** can be made from your mistakes; each card still opens its source slide.
- **Map questions:** draw a line (rivers) or circle an area (regions, seas) as well as placing a
  point. After submission, a coarse pixel-grid comparison with an approximate guide shape gives
  practice feedback, and the guides are drawn as dashed outlines.
- **Image difficulty** (easier / standard / harder) for image questions in lecture practice.
- **Slide notes:** a notes box under every slide or page, saved in the browser, with Markdown
  export and JSON backup/import.
- **Slide strip:** thumbnails beside the reader jump straight to a slide.
- **Timeline & links:** region × period grid of 35 dated items from Lectures 1–10 (each opens its
  slide), theme filters that link lectures, an “ask the tutor to compare” shortcut, a put-in-order
  chronology task, and “How do we know?” method examples.
- **Look and feel:** larger buttons and selectors (study scope, lecture filters, quiz tabs),
  plainer labels and fewer decorative icons.

## Support (17 November 2026)

- Search engines are told not to index the site, slide images or API (`noindex` metadata,
  `robots.txt`, `X-Robots-Tag`). The GitHub repository itself still needs to be made private
  by the owner.
- `/api/chat` and `/api/flashcards` share one request guard: requests must come from the
  study page (`Origin` or `Sec-Fetch-Site: same-origin`), so plain scripts are refused.
  Rate limits are unchanged (12 questions / 4 decks per minute per IP, per server instance).
- Server errors are logged as JSON with HKU keys and endpoints redacted.
- General practice opens on the latest lecture that has prepared questions; each lecture tab
  shows its question count, and lectures without questions offer a jump to one that has them.
- Tutor follow-ups ("why?", "what about Harappa?") reuse the previous question for search.
- The tutor system prompt moved to `lib/tutor-prompt.ts` (versioned).
- Retrieval evaluation set (`tests/eval/retrieval-cases.json`) with a minimum recall check.
- Practice content validation: duplicate IDs, missing fields, missing images and silently
  dropped questions now fail the tests.
- Flashcards: Leitner spaced review (1, 3, 7, 14, 30 days) stored in the browser.
- GitHub Actions CI runs lint, type check, tests and build.
- Ingest scripts accept `STRATUM_COURSE_DIR`; see `docs/ingest.md`.
- Items that need new accounts or keys are tracked in `docs/pending-external.md`.

## Lecture 8–9 upload (11 November 2026)

Tracing Nomads and Politics and Religion are available with their assigned
readings. The default view is All lectures (1–9); Quiz 2 remains limited to
L4–7. Duplicate L7 readings were retained as one copy. Raw student feedback
is not part of the public course library.

## Flashcard availability during service limits

Lecture 6 and 7 now each include 17 reviewed short-answer fallback cards. Use
**Use prepared cards · no generation needed** for a six- or ten-card set. The
normal Create button also returns prepared cards if generation fails, with a
clear explanation. New model-generated content still depends on the university
service's token allowance. Saved decks and progress continue to work locally.

## Current mock-paper availability (24 October 2026)

**General practice → Mock paper · Quiz 2** now covers Lectures 4–7. Quiz 1 mocks
are temporarily hidden; their content and browser saves are preserved separately.
The mock layout adapts the earlier paper and is not an official Quiz 2 specimen.
Each new paper covers all four lectures. Written answers/maps use source-based
self-checking, while chronology retains automatic practice feedback.

## Lecture 6 and 7 slides (22 October 2026)

Both slide decks are now available in Read & ask, Quiz 2 scope and generated
short-answer flashcards. L6 has 119 slides; L7 has 123. Prepared questions for
these decks are still pending. See the continuous improvement log for validation
and the rollback checkpoint.

## Full mock papers (17 October 2026)

General practice now includes **Mock paper · Quiz 1 format**, covering L1–3
using the supplied six-task structure. It combines 2-of-3 image selection,
three-sentence answers, map placement, BCE/CE calculations and a seven-sentence
discussion. Submit to reveal model answers and checklists. Written responses
and maps are self-reviewed; only chronology has automatic correctness checks.
Numbered papers and drafts stay local. Print the current view or save as PDF
through the browser. Quick practice, flashcards and their downloads remain.

## Quiz 2 update (8 October 2026)

Quiz 2 (27 October) opens with Lecture 4–7 scope. Lecture 5 slides and the
new L5–7 readings are available; L6–7 slides are still required for their
practice and flashcards. See the continuous improvement log for the complete
feedback mapping and remaining limitations. The reader shows original pages,
flashcard retry retains saved answers, and a desktop slider adjusts tutor width.

## Student feedback update

See `docs/student-feedback-changes-2026-09-26.md` for the concise change note.
The active practice bank has 89 slide-based questions. New sets prioritize
questions not yet assigned across sessions. Flashcards offer Recall, Explain
and Apply/discuss levels plus an optional written answer before model reveal.
Citations show matched source passages; regional China maps have geographic
context, and short slide captions are now included in retrieval. The original
feedback workbook and respondent data are not included in the repository.

Checkpoint: `checkpoint/pre-student-feedback-2026-09-26`.

Numbered practice sets preserve earlier progress. Flashcards support multiple saved
decks per lecture and downloadable/importable backups. Storage is device-local.

## University tutor service

The tutor and generated flashcards use HKU Claude Haiku 4.5 through the
Bedrock-compatible Converse API. Tutor responses use ConverseStream, translated
to the existing browser SSE format. Original slide images remain attached with
source labels. Flashcard JSON is validated against supplied slide excerpts;
prepared fallback cards remain clearly labelled. Subscription credentials are
server-only and never sent to the browser or committed. Provider URLs and raw
errors are not logged because HKU authentication uses a query parameter.

Checkpoint before migration: `checkpoint/pre-hku-claude-2026-09-26`.

## Lecture 4 release

The current L4 deck is the supplied 97-slide “Interacting with the Environment”
file, replacing the older 99-slide version. Restored selected readings are the
15-page Frogley et al. paper and a labelled National Geographic study summary
with its original article link. No substantive PowerPoint speaker notes or
separate L4 lecture-notes file was supplied; the reader provides the original
slides and their extracted text. The wider research-literature collection stays
hidden. Ten L4 slide-based practice questions include model answers and marking.

Checkpoint: `checkpoint/pre-lecture4-2026-09-25`.

## Lenient slide marking

Checkpoint: `checkpoint/pre-lenient-slide-marking-2026-09-20`. Marked slide sets
use a new versioned browser key, preserving earlier self-check sets separately.
Tolerances are teaching aids authored for this app, not professor-approved limits.

## Slides-only revision

`checkpoint/pre-slides-only-quiz-2026-09-20` preserves the previous mixed-source
practice. `release/slides-only-quiz-2026-09-20` records this revision. Readings
remain available to the tutor; exclusion is specific to quiz and flashcard flows.

## Backups

- Before public games: `checkpoint/pre-public-games-2026-09-20`.
- Before expanding to 45 questions: `checkpoint/pre-question-expansion-2026-09-20`.
- Before this consolidation: `checkpoint/pre-unified-quiz-practice-2026-09-20`.
- Consolidated release: `release/unified-quiz-practice-2026-09-20`.

To reverse this release, revert its tagged commit and push to the production
branch. Resolve conflicts if later edits depend on it; avoid force-pushing.
The former private testing site's source remains backed up in its private
repository, while its Vercel project has been retired.

## Development and hosting

Run `npm ci`, set server-only `HKU_CLAUDE_KEY` and optional `HKU_CLAUDE_MODEL` in
`.env.local`, then `npm run dev`. Verify with `npm run lint`, `npm test`,
`npm run build`, and `npx tsc --noEmit`. Course page originals are bundled for
visual model context. Practice marking is browser-local and makes no external requests.
Existing origin checks and per-instance IP rate limits remain on model APIs.
Whole-class tutor capacity requires separate quota checks and load testing.

Official project: `arcl1001-study`; production branch: see the linked Vercel project’s Git settings.
Official site: https://arcl1001-study-boscofungg.vercel.app/

## General practice and flashcards

Choose a Lecture 1, 2, 3 or 4 slide deck in the practice navigation. Practice has
89 slide-supported image-identification, map-labelling and concise-answer
questions; MCQs have been removed to follow the announced quiz formats.
Each suggested answer links only to its original lecture slide(s). Multi-part answers receive criterion-based automatic practice marking and
partial credit. Common paraphrases and explicitly authored numerical tolerances
are accepted; BCE/CE and elapsed-age units remain distinct. Every reveal shows
the exact slide-based model answer, accepted practice ranges and source links.
These are not official exam marks; unusual valid wording may still need review.

Flashcards also use only lecture slides. The API rejects PDF/web-reading source
requests; excerpt selection, validation, prepared fallback and saved-deck checks
all enforce Lecture sources. The practice/flashcard sidebar shows only the four
slide decks. PDF and web readings remain indexed and selectable in Read & ask,
and the chatbot can still answer questions about them.

Slide-only practice and flashcards use new browser-storage namespaces. Earlier
reading-based, mixed-source and MCQ sets remain archived in their previous keys,
but cannot reappear in the new review flow. Marked responses and results are saved per lecture in the current browser,
and are marked locally. Reveal-only questions earn no marks and go to review. No cross-device sync exists.

The former `/expeditions` URL redirects to `/?view=practice`.

