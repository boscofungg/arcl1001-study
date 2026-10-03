# Student feedback and continuous improvement log

Maintained for the ARCL1001 study site. Last updated: 4 October 2026.

## Purpose and evidence

Record what students reported, what changed, how the change was checked, and
what still needs follow-up. Do not include student names, emails, raw chat logs,
credentials or the original response workbook in this public repository.

The first review covered seven responses from the supplied **ARCL1001 AI Tutor
Feedback Submission.xlsx**. Usefulness ratings were 3–5, averaging 4.0/5.
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
not guarantee every AI interpretation is correct. Difficulty labels are study
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
