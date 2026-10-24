# Student feedback and continuous improvement log

Maintained for the ARCL1001 study site. Last updated: 4 October 2026.

## Purpose and evidence

Record what students reported, what changed, how the change was checked, and
what still needs follow-up. Do not include student names, emails, raw chat logs,
credentials or the original response workbook in this public repository.

The first review covered seven responses from the supplied student feedback workbook. Usefulness ratings were 3–5, averaging 4.0/5.
This small sample describes those respondents, not the whole class.

Implementation release: [3a12f38](https://github.com/boscofungg/arcl1001-study/commit/3a12f38),
26 September 2026. Detailed release note: [Student feedback changes](student-feedback-changes-2026-09-26.md).

## Improvement register

| ID | Feedback or need | Implemented response | Status and verification | Next check |
| --- | --- | --- | --- | --- |
| F01 | Correct citation page, but exact paragraph or phrase hard to identify. | Visible **Cited passage** panel quotes matched source text; original-page highlights remain. | Implemented; exact-match and bounded-preview tests plus browser citation check passed. | Ask students whether the passage supports the specific claim, not merely whether it is on the right page. |
| F02 | Erlitou and Yinxu difficult to distinguish on a China outline map. | Shared regional zoom with Yellow River, province boundaries, coordinates, scale and China locator inset. | Implemented; preserved site coordinates, map tests and visual checks passed. Modern reference geography and approximate locations are labelled. | Retest both maps on phones; confirm the cues help without revealing the answer. |
| F03 | Flashcards too easy for some students and too difficult for others. | **Recall, Explain and Apply/discuss** difficulty choices; prompts remain grounded in lecture-slide evidence. | Implemented; request validation and prompt tests passed; live harder-level generation returned six cards. | Compare perceived difficulty across levels; professor review is still needed for official quiz alignment. |
| F04 | Students prefer writing full answers to filling blanks. | Optional written response before flashcard **Model answer** reveal. General practice retains open image, map and concise-answer questions. | Implemented; typed-answer and reveal browser checks passed. Flashcard responses are self-assessed, not automatically marked. | Check whether students attempt an answer before revealing it. |
| F05 | Practice repeats and misses parts of the slides. | Eight added slide-backed questions, including Tikal and Tel-Abada; 53 active questions at this release. Sets prioritise unattempted questions across sessions. | Implemented; source/rubric tests, unseen-first tests and browser rounds passed. | Collect specific missing sites/topics and repetition examples before extending the bank further. |
| F06 | Broad questions sometimes give examples without a short explanation of the concept. | Tutor prompt requests an evidence-supported definition before examples; search includes short slide captions previously omitted. | Implemented; site-retrieval regressions passed; live hierarchy explanation began with a definition. | Check definitions for clarity and factual support; image-only labels may still be missed. |
| F07 | Vitrification question appeared to come from crossed-out reading material. | Retained and verified the earlier slides-only boundary for practice and flashcards. Readings remain available to chatbot Q&A. | Already addressed before this feedback release; active-bank regression confirms reading-only vitrification is absent. | Obtain explicit professor guidance before using marked-up reading sections for assessment practice. |

## Validation record

- 127 automated tests passed for the feedback release.
- Lint, TypeScript and production build passed.
- Desktop/mobile checks covered cited passages, typed flashcard answers,
  difficulty selection, non-repeating practice sets and layout.
- Live checks confirmed updated maps and six generated Explain-level cards.
- Original feedback workbook remained unchanged; no respondent data was published.
- Rollback checkpoint: `checkpoint/pre-student-feedback-2026-09-26`.
- Release tag: `release/student-feedback-2026-09-26`.

## Limits and open follow-up

Implementation is complete for the changes above; improved student outcomes have
not yet been demonstrated by a follow-up study. Citations and quoted evidence do
not guarantee every tutor interpretation is correct. Difficulty labels are study
settings, not an official exam specification. Modern map geography does not
reconstruct ancient river courses or political boundaries.

No blanket guarantee is made that all slide sites are searchable, particularly
unlabelled images. No general rule has been inferred from red markings in PDFs;
practice continues to use lecture slides only.

## How to maintain this log

1. Add a new ID for each distinct issue, preserving its original report date and
   a de-identified example, lecture, slide/page and affected feature.
2. Set status to **Reported**, **Reproduced**, **In progress**, **Implemented**,
   **Retested by students**, or **Deferred**. Record why an issue is deferred.
3. Link the implementation commit or pull request; describe actual behaviour and
   relevant tests, including any remaining limits.
4. After student retesting, record the date, number of testers and observed result.
   Do not relabel implementation checks as learning-effectiveness evidence.
5. Add regressions for confirmed factual/source errors and preserve rollback tags
   before substantial changes. Keep future entries below in chronological order.

## Subsequent reviews

No follow-up student responses have been recorded in this log yet.

## Follow-up: practice variety and saved flashcards — 4 October 2026

| ID | Feedback | Change | Verification / limits |
| --- | --- | --- | --- |
| F08 | Starting another practice set repeats questions. | Numbered saved sets per lecture; every assigned question counts as seen, even before submission. New sets draw unseen questions first and keep earlier progress. Mixed-format order is shuffled. | Library regression tests cover early restarts, reloads, migration and exhaustion. Questions may repeat after the selected pool is exhausted. Up to 100 sets per lecture. |
| F09 | More questions, images and comparisons from slides. | 24 new questions (six per lecture): bank grows from 53 to 77. Four new image questions cover Lucy, Red Pyramid, jade ge dagger and quipu; four new comparison questions. | Every source is a lecture slide; evidence and model-answer rubric tests pass. Crops visually checked for answer labels. These are reviewed prepared questions, not unverified live-generated assessments. |
| F10 | Vary wording and photos. | Alternate wording for 31 existing questions, selected and retained per saved set. Great Bath may use either the original reconstruction or a real-site photograph from L3 slide 54, with matching citation. | Different wording does not count as a new learning objective. Other objects retain verified original images; no unrelated or generated photographs substituted. |
| F11 | Accept small spelling mistakes. | Conservative single-edit correction for selected longer proper names, plus transposed/repeated letters in selected technical terms. Exact model answers remain visible. | Numeric parsing, negation and meaning-changing wording stay strict. Not a general spellchecker or official marking scheme. |
| F12 | Keep generated flashcard questions. | Multiple local decks per lecture, selection, saved review progress, JSON backup/import and deletion. Previous current deck migrates. | Slide-only validation; import preserves local progress for duplicate deck IDs. Up to 40 decks per lecture. No cookies or login needed. Written draft answers are still not saved or automatically marked. |

### Release checks and rollback

- 140 automated tests passed, covering library persistence, no-repeat selection, rubric accuracy,
  image/source validity and conservative spelling tolerance.
- Browser checks: two practice sets, switching/reload, model-answer reveal;
  two real generated flashcard decks, switching and retained review progress.
- Lint, TypeScript and production build checked before release.
- Rollback tag: `checkpoint/pre-practice-variety-2026-10-04`.
- Device-local data can be lost when browser storage is cleared. Flashcard backup
  download/import is the portable recovery option; no cross-device cloud sync.
- Follow-up: ask whether students encounter fewer repeated topics, whether the
  comparison marking recognises their valid answers, and whether saving and
  reopening decks is easy to understand. Professor review remains desirable.

## Interface and maintenance wording — 4 October 2026

Simplified student-facing notices and service errors, renamed provider modules
and their tests to describe their responsibilities, and removed obsolete local
workspace details from release documentation. Source credits, source-checking
advice, server configuration and study functionality are retained.

Validation: 140 tests, lint, TypeScript and production build passed.
Rollback checkpoint: `checkpoint/pre-notice-cleanup-2026-10-04`.

## Quiz 2 and testing feedback — 8 October 2026

Quiz 2 date supplied by the project team: **27 October 2026**. Scope: Lecture 4
Humans and Environment; Lecture 5 Visual Power; Lecture 6 Food Culture / Hong Kong
Archaeology; Lecture 7 Violence. The official question specification has not been
supplied, so the existing short-answer, image-identification and map formats are
revision aids, not a claimed replica of the paper.

| ID | Feedback / need | Implemented response | Limits and next check |
| --- | --- | --- | --- |
| F13 | Prepare for Quiz 2. | Default Quiz 2 navigation and tutor source boundary for L4–7; All lectures preserves access to earlier content. Imported all six attachments: 104 L5 slides and five PDFs (60 pages). Two linked web-reading summaries added. | L6–7 slide decks were not supplied or located; their readings are available, while practice and flashcards require lecture slides. Classical archaeology supplementary reading is grouped under L5 provisionally, explicitly labelled in its summary. |
| F14 | Page arrows feel reversed and pages do not jump correctly. | Explicit large Previous/up and Next/down controls; page input auto-jumps; visible-page number tracks scrolling; pending jumps stay aligned as lazy images load. | Browser checked 55 → 56 → 55, typed jump and scroll updates. Extracted text/Both controls removed. Original pages, citation highlights and linked-reading summaries remain. |
| F15 | Modes look too similar; too much text and too many controls. | Green reading, amber practice and purple flashcard accents; larger labels and headings; optional saved-deck management collapses. | Colours supplement text labels and icons; both themes and narrow layout reviewed. |
| F16 | Flashcard retry appears to change the answer. | Explicit Retry same set / Create a different set separation. Retry reuses the saved deck and clears only draft/reveal state. Regression tests check unchanged questions, answers and images. | No answer-regeneration bug was reproduced in the existing retry helpers. Avoid claiming this was a confirmed backend defect. |
| F17 | Flashcards should match quiz formats and include visuals. | Short-answer prompts tightened; reviewed image/map identification mode added. Cropped question images hide labels; the original cited slide appears after answer reveal. | Only vetted single-source image questions enter identification mode. L5 currently has short-answer cards; original L5 source visuals still appear on reveal. |
| F18 | Resize and reopen chatbot more easily. | Desktop tutor-width slider remembers its size locally; close/reopen through a floating square widget; mobile overlay retains close/reopen. | No third-party widget or new dependency. |
| F19 | No follow-up questions. | Three optional follow-up buttons after successful responses: more evidence, interpretation limits, or one recall question. Requests focus the actual retrieved source page. | Suggestions are contextual actions, not newly invented factual claims. |
| F20 | More slide-based practice and clearer product advantage. | Added 12 L5 questions with model answers and rubrics, bringing the bank to 89. | The product emphasis is course-specific scope, original visuals, checkable citations and repeatable recall. Superior learning outcomes versus other tools have not been demonstrated. |

### Content and verification

- Original files unchanged; source hashes, page counts and extraction metadata
  are recorded in the source manifest. Scanned L6 seafood reading uses visually
  checked OCR with real text boxes. Book front matter stays out of study retrieval.
- Web links are short authored summaries with links to publisher originals;
  neither is presented as a complete article.
- Automated coverage includes new content counts/assets, Quiz 2 retrieval
  boundaries, slide-only practice, stable retries and canonical image-card imports.
- Existing local flashcard and practice libraries remain compatible.
- Screenshot references inspired a visual-first reader; arbitrary image-region
  selection, annotation colours and an image-cropping editor are not implemented.
- Rollback checkpoint: `checkpoint/pre-quiz2-2026-10-08`.

Release validation: **148 automated tests passed**, ESLint, TypeScript and
production build passed. Desktop/narrow-screen browser checks covered reader
jump/scroll direction, tutor resizing and floating controls, live L5 response
with source-focused follow-ups, flashcard visual reveal and same-answer retry,
and L5 practice. APIs rejected out-of-scope Quiz 2 and reading-only flashcard
requests (HTTP 400). Visual review passed after reducing optional controls and
strengthening dark-theme mode accents.

## Offline question and flashcard downloads — 8 October 2026

Students can download the selected practice set or saved flashcard deck as a
self-contained HTML study sheet, with embedded question images and a separate
model-answer/source section. An option exports questions only. The browser’s
Print command can print the sheet or save it as PDF. CSV is also available for
spreadsheet use; image links in CSV require a connection. The original flashcard
JSON backup/import remains for restoring review progress.

Practice exports preserve the selected wording and image variants. Downloads
exclude students’ written responses and scores. Full course-slide originals
are linked from the answer key rather than copied into every export. Export
text is HTML-escaped and CSV formulas are neutralized. Image download failures
are shown rather than silently producing an incomplete visual question sheet.

Rollback checkpoint: `checkpoint/pre-study-downloads-2026-10-08`.

Validation: 151 automated tests, lint, TypeScript and production build passed.
Browser checks confirmed practice HTML/CSV and questions-only flashcard files
reach the prepared state, including images. A persistent Save file link handles
blocked automatic downloads. The in-app browser automation did not report a
completed download event, so that browser's final disk-save step was not verified.

## Actual Quiz 1 format and full-paper revision — 17 October 2026

### Evidence and interpretation

The supplied two-page Quiz 1 paper contains six tasks: choose two of three images
(period, site, modern location, ancient culture); a three-sentence concept/method
answer; mark and label three geographic features; two BCE/CE chronology pairs;
a three-sentence significance answer; and a seven-sentence discussion with
specific class examples. The PDF contains the outline map but not the three
identification images. It supplies no duration, mark allocation or answer key.

The updated feedback workbook contains **11 responses total**, including earlier
submissions, with ten usefulness ratings averaging **3.9/5**. This is not quiz
performance data. Peter's report of disappointing results motivates the update,
but neither attachment establishes the cause of those results or proves that
these changes will improve grades. No respondent information or raw workbook
was committed.

### Changes linked to feedback

| ID | Feedback / gap | Response | Boundary |
| --- | --- | --- | --- |
| F21 | Single images did not resemble quiz image choice. | A simultaneous three-image panel; students choose exactly two and answer period, site, modern location and culture separately. Six verified slide-image candidates rotate. | Uses supplied lecture images, not a claim to reproduce the quiz's missing projected images. |
| F22 | Practice format too narrow; written answers and discussion needed. | New Mock paper tab inside General practice, with six sections in the actual order, full written answers, three-/seven-sentence guides and four variants each for concept, significance and discussion. | L1–3 revision based on Quiz 1; not a prediction of Quiz 2. Quick practice and flashcards remain available. |
| F23 | Need broader questions and more variations rather than repetition. | New numbered papers select different images and prompts before reuse; dates vary; map target sets alternate. Papers persist locally and retry preserves exact questions. | Finite curated content, not unlimited novel questions. Up to 30 saved papers; browser data clearing removes them. |
| F24 | Map task did not match marking locations. | Use the original blank outline map with labelled click/tap markers and keyboard position controls; reveal approximate model locations and explanations after submission. | Regions/rivers are not single points. No invented distance-based grade; low-resolution/cropped original map documented. |
| F25 | Chronology absent from current practice. | Two pairs per paper: same-era BCE and across BCE/CE, recent-year selection and interval calculation with automatic checks. | Historical elapsed years exclude year zero. Across-era simple addition is also accepted for practice because the official course convention was not supplied; difference explicitly explained. |
| F26 | Need to practise complete attempts, not immediate answer reveal. | Whole-paper submission unlocks model answers, evidence checklists and source links. Drafts and submitted attempts stay in the browser; print current view or save via browser PDF. | Written answers and map work are self-reviewed, not automatically or officially graded. Sentence count is an approximate guide. |

Earlier fixes continue to address citations, regional map details, differing
flashcard difficulty preferences, mode colours and tutor resizing. These were
not counted as new fixes. This release prioritizes the newly evidenced mismatch
between actual assessment tasks and isolated practice cards.

### Validation and follow-up

Automated tests cover paper structure, immediate image/prompt variation,
persistence/corruption handling, exact BCE/CE calculations, source slide evidence,
model answer sentence limits and map bounds. Browser checks cover the three-image
selection limit, hidden answers, draft reload, submission, chronology feedback
and creation of another saved paper. Print styles preserve written text without
textarea clipping; native PDF export remains browser-dependent.

Ask Peter to verify the model checklists and BCE/CE convention, and supply the
original projected image choices if exact-paper review is wanted. For the next
pilot, record whether students can give all four identification fields, write
concise evidence-based explanations, locate regions and handle BCE/CE dates.
These task-specific observations will be more useful than satisfaction alone.

Rollback checkpoint: `checkpoint/pre-mock-paper-2026-10-17`.

Release checks: **157 automated tests passed**, lint, TypeScript and production
build passed. Desktop and narrow-screen review checked readable image panels,
map controls and no answer leakage before submission. The native print/PDF
save dialog was not exercised in the automated browser checks.

## Lecture 6 and 7 slide upload — 22 October 2026

Imported the newly supplied **Lecture 6 — Food and Foodways (119 slides)** and
**Lecture 7 — Violence (123 slides)**. Both decks are available in the course
reader, Quiz 2 source scope, document-specific chatbot questions and short-answer
flashcard generation. Original layouts are rendered as page images with text
coordinates for citations; original attachments are unchanged and hashes are
recorded in the ingestion manifest. Existing readings remain available.

Prepared General practice questions and reviewed image-identification cards for
these two lectures are not part of this upload. The practice screen now states
that clearly rather than suggesting that the slides themselves are unavailable.
Quiz 1 mock-paper content is unchanged.

Rollback checkpoint: `checkpoint/pre-lecture6-7-2026-10-22`.

Validation: 158 automated tests, lint, TypeScript and production build passed.
Every new slide has an original-page preview; all 119/123 page counts match the
PowerPoint presentation order. Searchable corpus blocks cover 87 L6 pages and
101 L7 pages; other slides remain viewable as images, and short visual labels
are available to slide retrieval. Representative title and content previews
were visually checked. Document-scoped retrieval and flashcard excerpt selection
passed for both lectures.

## Quiz 2 mock papers; Quiz 1 temporarily suspended — 24 October 2026

Replaced the active mock-paper interface with **Quiz 2 mock papers covering
Lectures 4–7 only**. The earlier six-part layout is a revision template from
Quiz 1; the actual Quiz 2 paper, timing and marking scheme have not been supplied.
The interface states that distinction.

- Added eight reviewed image candidates, two per lecture, with period/site/modern
  location/culture answers and cited slide evidence. Captions that disclose the
  answer are excluded from the question images. Broad site periods are identified
  as such rather than asserted as exact object construction dates.
- Added four concept, four significance and four discussion prompts. Written
  models retain the three-/seven-sentence limits and named material examples.
- Rotated written topics and included an image from the remaining lecture so
  every paper covers all four lectures. Three sets of map targets now use Quiz 2
  regions (Andes, Maya region, Iran, Greece, Hong Kong and Denmark).
- Retained saved papers, draft answers, whole-paper submission, source checklists,
  exact-question retries and print/PDF controls. Chronology includes BCE, CE and
  across-era pairs, with the existing explicit calendar-convention explanation.
- Temporarily hid the Quiz 1 mock-paper option. Its question bank, engine and old
  `stratum-mock-paper-v1` browser data remain intact. Quiz 2 uses a separate
  `stratum-quiz2-mock-paper-v1` key; no old papers are migrated or overwritten.
  Earlier lecture materials, quick practice and flashcards remain available.

Visual source evidence is explicitly identified where location labels occur in
map imagery rather than extracted text. Map placements remain approximate guides
for self-review, not automatic distance grades. Quiz 1 can be restored without
reconstructing its content or deleting Quiz 2 attempts.

Rollback checkpoint: `checkpoint/pre-quiz2-mocks-2026-10-24`.

Validation: **165 automated tests passed**, lint, TypeScript and production build
passed. Tests cover L4–7 evidence, all-lecture paper coverage, variation, separate
storage, rejection of cross-quiz saved data and continued parsing of old Quiz 1
papers. Browser checks verified hidden Quiz 1 controls, creation of two Quiz 2
papers, draft reload, submission/model-answer reveal and narrow-screen map layout.
Native print/PDF export was not re-tested in this release.
