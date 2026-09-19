# Quiz 1 revision release

## Scope and acceptance

The meeting notes prioritize selected Lectures 1–3, image identification (name/place/period), map labelling, concise short answers and cross-context comparisons. The provided materials do not contain an official Quiz 1 specimen paper, timing, mark scheme or question counts. The app therefore labels its sample sets as **practice, not an official paper**.

Active content is the six newly supplied lecture/reading files and three explicitly requested web readings. Older lecture/literature collections are removed from this release, not silently treated as Moodle-required reading. Web readings appear as clearly labelled original study summaries with links to the full publisher pages. Source page/slide numbering is rebuilt from the new files.

The study workspace opens a scrollable original document beside the tutor. Viewing or focusing a page does not prevent questions across other Quiz 1 materials. Retrieval returns evidence for both named places in comparisons. Citation highlights use real extraction boxes and exact normalized text; the app does not fabricate highlight coordinates for unmatched content.

Quiz practice uses prepared, source-checked question cards without runtime AI requests. Fronts hide answers and source titles, including neutral filenames/alt text for images. Maps use documented approximate coordinates, not an official exam map. Self-check ratings are not automated exam marks. Additional AI text flashcards use constrained source excerpts and quote checks; they fall back to explicitly labelled prepared cards when possible.

## Rollback and backups

- GitHub checkpoint: `checkpoint/pre-quiz1-2026-09-19`
- Checkpoint commit: `b86e327b9000fd732677c7ad5e4fe62e4edacdb1`
- Original local checkout is preserved at `/Users/boscofungg/Desktop/HKU/APAI3799 Capstone copy/study-workspace`.
- This revision is developed separately in `quiz1-workspace` on `codex/quiz1-revision`.
- The pending HKU Claude migration remains in the original checkout's Git stash. It is not part of this release.
- Release tag: `release/quiz1-2026-09-19` (created when this release is committed).

To reverse this release while retaining history, from the current production branch:

```sh
git fetch origin --tags
git revert release/quiz1-2026-09-19
git push origin HEAD:codex/study-workspace
```

Vercel redeploys the reverted source. If later changes cause conflicts, resolve them against the checkpoint instead of force-pushing. Vercel can also restore the previous production deployment immediately from its deployment history; align Git afterwards so the next push does not reintroduce the revision.

Source files supplied today remain unmodified in Downloads. The ingestion manifest records their SHA256 hashes. Credentials remain outside Git and are not changed by this content/UI release.

## Known limits and launch checks

- Prepared questions are not professor-approved exam questions; request a spot-check of image identity, date ranges, maps and accepted alternative wording before broad use.
- Static slides do not reproduce animations. OCR and text extraction can still omit or reorder text; the original preview remains visible.
- AI answers can still be wrong even when they contain valid citations. Highlights identify retrieved evidence, not a guarantee that every model claim follows from it.
- Prepared practice is local/static and needs no AI quota. Tutor and generated-card rate limits are per running server instance, not a durable university-wide quota.
- Pilot with 5–10 simultaneous students before inviting the whole class; record slow first replies, failures and quota messages. Do not describe this as a completed load test until that pilot is run.

See `student-feedback-quiz1.md` for the proposed feedback form and pilot tasks.
