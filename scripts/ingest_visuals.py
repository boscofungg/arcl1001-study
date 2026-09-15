"""Create faithful page previews; never infer descriptions or redraw source figures.

Requires PyMuPDF, Pillow and (for complete PPTX slides) LibreOffice.
Document identity is resolved by filename + week against documents.json.
"""
import argparse
from io import BytesIO
import json
import posixpath
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT.parent
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}


def source_key(path):
    match = re.search(r'Week (\d+)', str(path))
    return path.name, int(match[1]) if match else 0


def ppt_details(path):
    """Keep native table/chart values verbatim with their actual slide number."""
    details = {}
    with zipfile.ZipFile(path) as archive:
        slides = sorted((n for n in archive.namelist() if re.fullmatch(r'ppt/slides/slide\d+.xml', n)), key=lambda n: int(re.search(r'slide(\d+)', n)[1]))
        for number, name in enumerate(slides, 1):
            root = ET.fromstring(archive.read(name))
            texts = []
            for table in root.findall('.//a:tbl', NS):
                rows = [' | '.join(' '.join(el.text or '' for el in t.findall('.//a:t', NS)) for t in row.findall('a:tc', NS)) for row in table.findall('a:tr', NS)]
                texts.append('Source table:\n' + '\n'.join(rows))
            relname = posixpath.join(posixpath.dirname(name), '_rels', posixpath.basename(name) + '.rels')
            rels = {}
            if relname in archive.namelist():
                rels = {r.attrib['Id']: r.attrib.get('Target', '') for r in ET.fromstring(archive.read(relname)) if r.attrib.get('TargetMode') != 'External'}
            for chart in root.findall('.//c:chart', NS):
                target = rels.get(chart.attrib.get('{' + NS['r'] + '}id'))
                chartname = posixpath.normpath(posixpath.join(posixpath.dirname(name), target)) if target else ''
                if chartname in archive.namelist():
                    chartroot = ET.fromstring(archive.read(chartname))
                    vals = [el.text for el in chartroot.findall('.//c:v', NS) if el.text]
                    if vals:
                        texts.append('Source chart labels and cached values (XML order): ' + ' | '.join(vals))
            details[number] = {'text': '\n'.join(texts), 'imageOnly': not any((el.text or '').strip() for el in root.findall('.//a:t', NS))}
    return details


def save_image(image, dest, size, quality):
    image = image.convert('RGB')
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    image.save(dest, 'WEBP', quality=quality, method=4)
    return image.width, image.height


def render_pdf(path, doc, dest, size, quality, details=None):
    pages = []
    with pymupdf.open(path) as pdf:
        for number, page in enumerate(pdf, 1):
            scale = size / max(page.rect.width, page.rect.height)
            pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
            image = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
            filename = f'page-{number}.webp'
            width, height = save_image(image, dest / filename, size, quality)
            original = (details or {}).get(number, {})
            item = {'page': number, 'images': [{'src': f'/materials/{doc["id"]}/{filename}', 'width': width, 'height': height, 'alt': f'{doc["title"]} — original {"slide" if details is not None else "page"} {number}'}], 'imageOnly': original.get('imageOnly', len(page.get_text().strip()) < 35)}
            if original.get('text'):
                item['text'] = original['text']
            pages.append(item)
    return pages


def extract_ppt_images(path, doc, dest, size, quality, details):
    pages = []
    with zipfile.ZipFile(path) as archive:
        for number in range(1, doc['pages'] + 1):
            name = f'ppt/slides/slide{number}.xml'
            relname = f'ppt/slides/_rels/slide{number}.xml.rels'
            root = ET.fromstring(archive.read(name))
            rels = {r.attrib['Id']: r.attrib.get('Target', '') for r in ET.fromstring(archive.read(relname)) if r.attrib.get('TargetMode') != 'External'} if relname in archive.namelist() else {}
            images, seen = [], set()
            for blip in root.findall('.//a:blip', NS):
                target = rels.get(blip.attrib.get('{' + NS['r'] + '}embed'))
                asset = posixpath.normpath(posixpath.join('ppt/slides', target)) if target else ''
                if not asset or asset in seen or asset not in archive.namelist():
                    continue
                seen.add(asset)
                try:
                    image = Image.open(BytesIO(archive.read(asset)))
                    if max(image.size) < 150 or min(image.size) < 30:
                        continue
                    filename = f'page-{number}-image-{len(images)+1}.webp'
                    width, height = save_image(image, dest / filename, size, quality)
                    images.append({'src': f'/materials/{doc["id"]}/{filename}', 'width': width, 'height': height, 'alt': f'{doc["title"]} — embedded image from slide {number}'})
                except (OSError, ValueError):
                    continue
            item = {'page': number, 'images': images, 'imageOnly': details.get(number, {}).get('imageOnly', False)}
            if details.get(number, {}).get('text'):
                item['text'] = details[number]['text']
            pages.append(item)
    return pages


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--size', type=int, default=1400)
    parser.add_argument('--quality', type=int, default=65)
    parser.add_argument('--resume', action='store_true', help='Reuse complete previews at the same settings')
    args = parser.parse_args()
    documents = json.loads((ROOT / 'lib/documents.json').read_text())
    sources = {}
    for path in list((BASE / 'ARCL1001-CourseMaterial').rglob('*')) + [BASE / 'ARCL1001-ArchaeologyGlobeSyllabus.pdf']:
        if path.suffix.lower() in ('.pdf', '.pptx'):
            key = source_key(path)
            if key in sources:
                raise ValueError(f'Ambiguous source filename/week: {key}')
            sources[key] = path
    renderer = shutil.which('soffice') or shutil.which('libreoffice')
    manifest, errors, fallbacks = {}, [], []
    if args.resume and (ROOT / 'lib/visuals.json').exists():
        previous = json.loads((ROOT / 'lib/visual-ingestion-report.json').read_text())
        if previous.get('maximumDimension') != args.size or previous.get('quality') != args.quality:
            raise ValueError('Resume settings differ from existing previews')
        cached = json.loads((ROOT / 'lib/visuals.json').read_text())
        for doc in documents:
            entry = cached.get(doc['id'])
            if entry and entry['filename'] == doc['filename'] and entry['week'] == doc['week'] and len(entry['pages']) == doc['pages'] and all((ROOT / 'public' / image['src'].lstrip('/')).is_file() for page in entry['pages'] for image in page['images']):
                manifest[doc['id']] = entry
    def ingest(doc):
        path = sources[(doc['filename'], doc['week'])]
        dest = ROOT / 'public/materials' / doc['id']
        dest.mkdir(parents=True, exist_ok=True)
        details = ppt_details(path) if path.suffix.lower() == '.pptx' else None
        representation = 'page'
        if details is None:
            pages = render_pdf(path, doc, dest, args.size, args.quality)
        else:
            with tempfile.TemporaryDirectory(prefix='course-slides-') as tmp:
                converted = Path(tmp) / (path.stem + '.pdf')
                if renderer:
                    subprocess.run([renderer, '-env:UserInstallation=' + (Path(tmp) / 'profile').as_uri(), '--headless', '--convert-to', 'pdf:impress_pdf_Export:{"ExportHiddenSlides":{"type":"boolean","value":"true"}}', '--outdir', tmp, str(path)], capture_output=True, timeout=240)
                if converted.exists():
                    pages = render_pdf(converted, doc, dest, args.size, args.quality, details)
                    if len(pages) != doc['pages']:
                        raise ValueError(f'Slide count changed: {len(pages)} != {doc["pages"]}')
                else:
                    representation = 'slide-images'
                    pages = extract_ppt_images(path, doc, dest, args.size, args.quality, details)
                    fallbacks.append(doc['id'])
        result = {'representation': representation, 'sourceType': path.suffix[1:].lower(), 'filename': doc['filename'], 'week': doc['week'], 'pages': pages}
        print(f'{doc["id"]}: {len(pages)} pages, {representation}', flush=True)
        return doc['id'], result
    # PyMuPDF is not thread-safe. Keep document rendering sequential.
    for doc in documents:
        if doc['id'] in manifest:
            continue
        try:
            ident, entry = ingest(doc)
            manifest[ident] = entry
        except Exception as error:
            errors.append({'id': doc['id'], 'error': str(error)})
    assets = list((ROOT / 'public/materials').rglob('*.webp'))
    report = {'documents': len(manifest), 'pages': sum(len(d['pages']) for d in manifest.values()), 'imageOnlyPages': sum(p['imageOnly'] for d in manifest.values() for p in d['pages']), 'images': len(assets), 'assetBytes': sum(p.stat().st_size for p in assets), 'maximumDimension': args.size, 'quality': args.quality, 'renderer': 'LibreOffice' if renderer else None, 'fallbackDocuments': fallbacks, 'errors': errors, 'limitations': ['Previews preserve original content; no generated captions or automatic claims about figures.', 'PPTX slides are rendered by LibreOffice; unusual fonts, animations and external media may differ from PowerPoint.', 'Scanned pages are visible but have no new searchable OCR text.', 'Charts are visible; only native PPTX chart/table values are extracted as additional text.']}
    (ROOT / 'lib/visuals.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
    (ROOT / 'lib/visual-ingestion-report.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
