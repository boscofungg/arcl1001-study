# Adding or replacing course materials

The original slides and readings are **not** in this repository. The ingest scripts read them
from a course folder and write the derived files that the app bundles.

## Inputs

```
<course folder>/
  ARCL1001-CourseMaterial/       # Week N/… folders with .pptx slides and .pdf readings
  ARCL1001-ArchaeologyGlobeSyllabus.pdf
```

By default the course folder is the directory that contains this repo. Override it with
`STRATUM_COURSE_DIR=/path/to/course-folder`.

Requirements: Python 3 with PyMuPDF and Pillow; LibreOffice for full-slide PPTX previews.

## Steps

1. Put the new files in the right `Week N` folder (readings under `Reading/`).
2. Rebuild the text index: `python3 scripts/ingest.py` → `lib/corpus.json`, `lib/documents.json`,
   `lib/ingestion-report.json`.
3. Rebuild the page images: `python3 scripts/ingest_visuals.py --resume` → `public/materials/d*/`,
   `lib/visuals.json`, `lib/visual-ingestion-report.json`.
4. Check both reports for skipped files and unindexed pages.
5. Add practice questions, rubrics and fallback flashcards in `content/` (lecture slides only).
   `tests/content-schema.test.mjs` fails if a question is malformed or silently dropped.
6. Add retrieval cases for the new lecture's key sites and terms to `tests/eval/retrieval-cases.json`.
7. Run the full checks, then follow `docs/release.md`.

Document IDs (`d101`…) come from file order. Adding a file can renumber later documents, which
breaks saved citations and question sources, so compare `lib/documents.json` before and after.
