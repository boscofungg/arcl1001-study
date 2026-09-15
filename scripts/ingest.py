"""Rebuild the course index from the original materials; requires PyMuPDF."""
import json, re, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
import pymupdf
BASE = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1] / 'lib'
files = sorted((BASE / 'ARCL1001-CourseMaterial').rglob('*')) + [BASE / 'ARCL1001-ArchaeologyGlobeSyllabus.pdf']
documents, chunks, skipped = [], [], []
for path in files:
    if path.suffix.lower() not in ('.pptx', '.pdf'): continue
    ident = f'd{len(documents)+1:03d}'
    match = re.search(r'Week (\d+)', str(path))
    week = int(match[1]) if match else 0
    kind = 'Lecture' if path.suffix == '.pptx' else ('Syllabus' if not week else ('Reading' if '/Reading/' in str(path) else 'Literature'))
    pages=[]
    try:
        if path.suffix == '.pptx':
            with zipfile.ZipFile(path) as z:
                slides=sorted((n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+.xml', n)), key=lambda n:int(re.search(r'slide(\d+)',n)[1]))
                for n in slides:
                    root=ET.fromstring(z.read(n))
                    paragraphs=[' '.join(p.itertext()) for p in root.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}p')]
                    pages.append('\n'.join(paragraphs))
        else:
            with pymupdf.open(path) as pdf:
                pages=[page.get_text(sort=True) for page in pdf]
    except Exception as e:
        skipped.append({'file':path.name,'reason':type(e).__name__}); continue
    title=path.stem
    for i,t in enumerate(pages):
        t=re.sub(r'[ \t]+',' ',t).strip()
        if len(t)<35: continue
        # Page boundaries are preserved so citations always resolve to one original page.
        for j in range(0,len(t),1400):
            piece=t[j:j+1600]
            if len(piece.strip())<35: continue
            chunks.append({'id':f'{ident}-p{i+1}-c{j//1400}','docId':ident,'page':i+1,'text':piece})
    documents.append({'id':ident,'title':title,'week':week,'kind':kind,'pages':len(pages),'indexedPages':sum(len(t.strip())>=35 for t in pages),'filename':path.name})
OUT.mkdir(exist_ok=True)
(OUT/'corpus.json').write_text(json.dumps(chunks,ensure_ascii=False))
(OUT/'documents.json').write_text(json.dumps(documents,ensure_ascii=False))
(OUT/'ingestion-report.json').write_text(json.dumps({'documents':len(documents),'chunks':len(chunks),'skipped':skipped,'limitations':'Extracted text only. Scanned pages, figures, charts and external .url links are not interpreted.'},indent=2))
print(json.dumps({'documents':len(documents),'chunks':len(chunks),'bytes':(OUT/'corpus.json').stat().st_size,'skipped':skipped}))
