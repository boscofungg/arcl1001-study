"""Build Quiz 1 sources, page previews and grounded text rectangles.

Run with ../.venv/bin/python scripts/rebuild-quiz1.py. Requires PyMuPDF,
Pillow and LibreOffice. Originals are read-only; article inputs are curated
summaries supplied in content/quiz1-web-readings.json, never scraped copies.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / 'Downloads'
SOURCES = [
    ('d101', 'L1-slides.pptx', 1, 'Lecture', 'Lecture 1 — Introduction to Archaeology', 78),
    ('d102', 'L2-Slides.pptx', 2, 'Lecture', 'Lecture 2 — Urbanization in the Mediterranean and Southwest Asia', 93),
    ('d103', 'L3-Slides.pptx', 3, 'Lecture', 'Lecture 3 — Social Hierarchy', 129),
    ('d104', 'L1-Reading-Principles of Archaeology.pdf.pdf', 1, 'Reading', 'Lecture 1 — Principles of Archaeology', 6),
    ('d105', 'L1-Reading-Archaeology 101.pdf', 1, 'Reading', 'Lecture 1 — Archaeology 101', 5),
    ('d106', 'L2-Reading-Principles of Archaeology.pdf.pdf', 2, 'Reading', 'Lecture 2 — Principles of Archaeology', 7),
    ('d110', 'L3-Reading-Principles of Archaeology.pdf', 3, 'Reading', 'Lecture 3 — Principles of Archaeology', 13),
]


def normalize(text):
    # NFC preserves mathematical and archaeological symbols; replace only common
    # presentation ligatures. Do not silently repair uncertain OCR characters.
    text = unicodedata.normalize('NFC', text)
    for old, new in {'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl', '\u00ad': ''}.items():
        text = text.replace(old, new)
    return re.sub(r'[ \t]+', ' ', text).strip()


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def slide_order(path):
    with zipfile.ZipFile(path) as archive:
        relations = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(archive.read('ppt/_rels/presentation.xml.rels'))}
        root = ET.fromstring(archive.read('ppt/presentation.xml'))
        return [relations[s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']] for s in root.findall('.//{http://schemas.openxmlformats.org/presentationml/2006/main}sldId')]


def normalized_box(rect, page):
    rect = pymupdf.Rect(rect) * page.rotation_matrix
    bounds = page.rect
    return [round(max(0.0, min(1.0, value)), 6) for value in (
        (rect.x0 - bounds.x0) / bounds.width, (rect.y0 - bounds.y0) / bounds.height,
        (rect.x1 - bounds.x0) / bounds.width, (rect.y1 - bounds.y0) / bounds.height)]


def text_blocks(page):
    result = []
    for block in page.get_text('dict', sort=True)['blocks']:
        if block.get('type') != 0:
            continue
        lines, rects = [], []
        def flush():
            if not lines:
                return
            rect = pymupdf.Rect(rects[0])
            for other in rects[1:]:
                rect |= pymupdf.Rect(other)
            text = normalize('\n'.join(lines))
            if text:
                result.append({'text': text, 'box': normalized_box(rect, page)})
        for line in block.get('lines', []):
            text = normalize(''.join(span['text'] for span in line.get('spans', [])))
            if not text:
                continue
            if sum(map(len, lines)) + len(text) > 1500:
                flush()
                lines, rects = [], []
            lines.append(text)
            rects.append(line['bbox'])
        flush()
    return result


def study_block(item):
    text = item['text']
    if len(text) < 25 or len(re.findall(r'\w+', text)) < 4:
        return False
    if re.match(r'^(Created from hkuhk|Price, T\. Douglas\. Principles|Copyright ©)', text):
        return False
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--reuse-images', action='store_true', help='Reuse previews only when the source originals have not changed')
    parser.add_argument('--only', nargs='+', help='Rebuild only these source IDs; retain verified unchanged sources and previews')
    args = parser.parse_args()
    known_ids = {source[0] for source in SOURCES}
    if args.only and not set(args.only) <= known_ids:
        parser.error('--only contains an unknown source ID')
    previous = {}
    if args.only:
        for key, filename in {'documents': 'lib/documents.json', 'corpus': 'lib/corpus.json', 'visuals': 'lib/visuals.json', 'manifest': 'content/quiz1-source-manifest.json'}.items():
            previous[key] = json.loads((ROOT / filename).read_text())
    renderer = shutil.which('soffice') or shutil.which('libreoffice')
    if not renderer and any(s[1].endswith('.pptx') and (not args.only or s[0] in args.only) for s in SOURCES):
        raise RuntimeError('LibreOffice is required to preserve complete slide layouts')
    documents, corpus, visuals, provenance = [], [], {}, []
    for ident, filename, week, kind, title, expected_pages in SOURCES:
        original = DOWNLOADS / filename
        if args.only and ident not in args.only:
            prior = next(s for s in previous['manifest']['sources'] if s['id'] == ident)
            if digest(original) != prior['sha256']:
                raise ValueError(f'{ident}: unchanged source hash does not match; include it in --only')
            documents.append(next(d for d in previous['documents'] if d['id'] == ident))
            corpus.extend(c for c in previous['corpus'] if c['docId'] == ident)
            visuals[ident] = previous['visuals'][ident]
            provenance.append(prior)
            continue
        dest = ROOT / 'public/materials' / ident
        dest.mkdir(parents=True, exist_ok=True)
        order = slide_order(original) if original.suffix.lower() == '.pptx' else None
        if order and len(order) != expected_pages:
            raise ValueError(f'{ident}: unexpected presentation slide count')
        with tempfile.TemporaryDirectory(prefix='quiz1-source-') as tmp:
            pdf_path = original
            if order is not None:
                subprocess.run([renderer, '-env:UserInstallation=' + (Path(tmp) / 'profile').as_uri(), '--headless', '--convert-to', 'pdf:impress_pdf_Export:{"ExportHiddenSlides":{"type":"boolean","value":"true"}}', '--outdir', tmp, str(original)], capture_output=True, check=True, timeout=240)
                pdf_path = Path(tmp) / (original.stem + '.pdf')
            pages, indexed = [], set()
            with pymupdf.open(pdf_path) as pdf:
                if len(pdf) != expected_pages:
                    raise ValueError(f'{ident}: rendered count {len(pdf)} != expected {expected_pages}')
                for number, page in enumerate(pdf, 1):
                    scale = 1400 / max(page.rect.width, page.rect.height)
                    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), colorspace=pymupdf.csRGB, alpha=False)
                    image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
                    image.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
                    asset = dest / f'page-{number}.webp'
                    if not args.reuse_images or not asset.exists():
                        image.save(asset, 'WEBP', quality=65, method=4)
                    blocks = text_blocks(page)
                    front_matter = ident in ('d104', 'd106', 'd110') and number <= 3
                    pages.append({'page': number, 'images': [{'src': f'/materials/{ident}/page-{number}.webp', 'width': image.width, 'height': image.height, 'alt': f'{title} — original {"slide" if order else "page"} {number}'}], 'imageOnly': sum(len(b['text']) for b in blocks) < 35, 'textBlocks': blocks, 'frontMatter': front_matter})
                    if not front_matter:
                        for index, block in enumerate(blocks):
                            if study_block(block):
                                corpus.append({'id': f'{ident}-p{number}-c{index}', 'docId': ident, 'page': number, 'text': block['text'], 'box': block['box']})
                                indexed.add(number)
            source_type = 'pptx' if order else 'pdf'
            documents.append({'id': ident, 'title': title, 'week': week, 'kind': kind, 'pages': len(pages), 'indexedPages': len(indexed), 'filename': filename, 'startPage': 4 if ident in ('d104', 'd106', 'd110') else 1})
            visuals[ident] = {'representation': 'page', 'sourceType': source_type, 'filename': filename, 'week': week, 'pages': pages}
            provenance.append({'id': ident, 'filename': filename, 'week': week, 'sha256': digest(original), 'sourceBytes': original.stat().st_size, 'renderedPages': len(pages), 'sourceSlideOrder': order, 'hiddenSlidesIncluded': bool(order), 'excludedStudyPages': [1, 2, 3] if ident in ('d104', 'd106', 'd110') else []})
            print(f'{ident}: {len(pages)} pages, {len(indexed)} indexed', flush=True)
    duplicate_l2 = DOWNLOADS / 'L2-Reading-Principles of Archaeology.pdf (1).pdf'
    if duplicate_l2.exists():
        l2 = next(source for source in provenance if source['id'] == 'd106')
        if digest(duplicate_l2) == l2['sha256']:
            l2['identicalAttachments'] = [{'filename': duplicate_l2.name, 'sha256': l2['sha256']}]
    readings_path = ROOT / 'content/quiz1-web-readings.json'
    readings = json.loads(readings_path.read_text())
    if isinstance(readings, dict):
        readings = readings.get('readings', readings.get('sources', []))
    if {r['id'] for r in readings} != {'d107', 'd108', 'd109'}:
        raise ValueError('Expected exactly three curated web readings d107–d109')
    for reading in readings:
        ident, title, week, url = (reading[k] for k in ('id', 'title', 'week', 'url'))
        summary = reading.get('text') or reading.get('summary')
        if not isinstance(summary, str) or not summary.strip():
            raise ValueError(f'{ident}: missing authored summary')
        filename = reading.get('filename') or title
        documents.append({'id': ident, 'title': title, 'week': week, 'kind': 'Web', 'pages': 1, 'indexedPages': 1, 'filename': filename, 'url': url, 'isSummary': True, 'startPage': 1})
        for index, paragraph in enumerate(re.split(r'\n\s*\n', summary.strip())):
            corpus.append({'id': f'{ident}-p1-c{index}', 'docId': ident, 'page': 1, 'text': normalize(paragraph), 'box': None})
        visuals[ident] = {'representation': 'page', 'sourceType': 'web', 'filename': filename, 'week': week, 'pages': [{'page': 1, 'images': [], 'imageOnly': False, 'textBlocks': []}], 'url': url, 'isSummary': True}
        provenance.append({'id': ident, 'url': url, 'week': week, 'isSummary': True, 'summarySha256': hashlib.sha256(summary.encode()).hexdigest(), 'renderedPages': 0})
    assets = [p for ident, *_ in SOURCES for p in (ROOT / 'public/materials' / ident).glob('*.webp')]
    report = {'documents': len(documents), 'chunks': len(corpus), 'skipped': [], 'excludedFrontMatterPages': sum(len(s.get('excludedStudyPages', [])) for s in provenance), 'limitations': 'Curated Quiz 1 sources only. Web readings are original summaries with links, not full articles. Text rectangles reflect extracted PDF text; image-only content requires visual reading. Slide animations are flattened.'}
    visual_report = {'documents': len(documents), 'pages': sum(len(d['pages']) for d in visuals.values()), 'imageOnlyPages': sum(p['imageOnly'] for d in visuals.values() for p in d['pages']), 'images': len(assets), 'assetBytes': sum(p.stat().st_size for p in assets), 'maximumDimension': 1400, 'quality': 65, 'renderer': 'LibreOffice with hidden slides; PyMuPDF', 'fallbackDocuments': [], 'errors': [], 'limitations': ['Web readings are linked summaries with no page screenshots.', 'Slide animations are flattened; unusual fonts or external media may differ from PowerPoint.', 'Text boxes mark actual extracted text; no fabricated OCR or inferred graphic labels.']}
    outputs = {'lib/documents.json': documents, 'lib/corpus.json': corpus, 'lib/visuals.json': visuals, 'lib/ingestion-report.json': report, 'lib/visual-ingestion-report.json': visual_report, 'content/quiz1-source-manifest.json': {'scope': 'Quiz 1 — Lectures 1–3 and assigned readings', 'sources': provenance, 'webReadingsInputSha256': digest(readings_path)}}
    for filename, data in outputs.items():
        target = ROOT / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        if filename == 'content/quiz1-source-manifest.json':
            target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        else:
            target.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    print(json.dumps(visual_report, indent=2))


if __name__ == '__main__':
    main()
