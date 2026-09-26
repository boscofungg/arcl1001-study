"""Rebuild source-derived Quiz 1 images and approximate map questions.
No slide numbers are inherited from the superseded September 15 decks.
"""
from pathlib import Path
import io, json, zipfile, subprocess, math, html
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT.parent
OUT=ROOT/'public/quiz1'
OUT.mkdir(parents=True,exist_ok=True)
FILES={1:'L1-slides.pptx',2:'L2-Slides.pptx',3:'L3-Slides.pptx'}
def source(lesson,page):
 return {'docId':f'd10{lesson}','page':page,'title':FILES[lesson],'label':f'Slide {page}'}
# Exact embedded assets inspected visually; crops remove only exterior answer-bearing credits.
ROWS=[
(1,51,'image81.png',None,'Identify the hominin specimen and its find location. Approximately how old is it?', 'The toothless individual from Dmanisi, Georgia; Homo erectus georgicus, approximately 1.7 million years ago. The lecture uses this specimen to discuss care.', 'The Toothless Old Man of Dmanisi, Georgia, 1.7MYA', ['Dmanisi','Homo erectus georgicus']),
(1,55,'image84.png',None,'Identify this fossil and its country of discovery. Give its approximate age.', 'Engis 2, a Neanderthal fossil from Belgium, approximately 40,000 years ago. Its discovery in 1829 is a different date from its age.', 'Engis 2; 1829, Belgium; Date: ~40 kya', ['Engis 2','Neanderthal','Belgium']),
(1,77,'image124.jpeg',None,'Identify this archaeological site, its country, and the approximate date range used in the lecture.', 'Göbekli Tepe, Türkiye; approximately 9500–8000 BCE. Its religious interpretation is presented as a question in the lecture.', 'Göbekli Tepe - Türkiye; c. 9500-8000 BCE; Early Religious Site??', ['Göbekli Tepe','Gobekli Tepe','Türkiye','Turkey']),
(2,45,'image70.jpeg',None,'Identify the object, its archaeological site, and its approximate date.', 'The Warka Vase, from a ritual deposit in the Inanna Temple at Uruk (Warka), approximately 3000 BCE. Its imagery is discussed as evidence for hierarchy.', 'Warka Vase: Hierarchy; ca 3000 BCE; found in ritual deposit of Inanna Temple', ['Warka Vase','Uruk','Warka']),
(2,48,'image76.png',None,'Identify this vessel type, its associated site, and approximate date range.', 'A bevel-rimmed bowl associated with Uruk, approximately 3300–3100 BCE. The lecture highlights mass production and uniform size; its precise purpose is posed as a question.', 'Beveled Rim Bowl; Uruk; ca. 3300–3100 BCE; Mass produced; Uniform size', ['bevel-rimmed bowl','beveled rim bowl','Uruk']),
(2,74,'image128.jpeg',None,'Identify this monument, its location, and approximate century.', 'The Step Pyramid of Djoser at the Saqqara Necropolis, Egypt; approximately the 27th century BCE.', 'Located in Saqqara Necropolis; Step Pyramid of Djoser (c.27th century BCE)', ['Step Pyramid of Djoser','Djoser','Saqqara']),
(2,76,'image135.jpeg',None,'Identify this pyramid, its associated ruler, and approximate century.', 'The Bent Pyramid of Snefru in Egypt; approximately the 26th century BCE. The change in slope gives the monument its distinctive profile.', 'Bent Pyramid of Snefru (c.26th century BCE)', ['Bent Pyramid','Snefru','Sneferu']),
(3,25,'image33.jpeg',(0,0,369,530),'Identify this sculpture, its archaeological site, and approximate date. Is its conventional name a confirmed occupation?', 'The “Priest-King” sculpture from Mohenjo-daro, approximately 1950 BCE. This conventional name does not establish that the depicted person was a priest or king; the lecture questions how society was organized.', 'Priest King Sculpture; Mohenjo-Daro; Ca 1950 BCE; Egalitarian society? Complex state? Neither?', ['Priest-King','Priest King','Mohenjo-daro']),
(3,55,'image90.jpeg',None,'This is a reconstruction. Identify the structure and site. Which broad cultural period is associated with the site?', 'The Great Bath at Mohenjo-daro, associated with the Mature Harappan period (approximately 2600–1900 BCE). The lecture describes a large public water tank and treats ritual use as a possibility.', 'Great Bath; Large public water tank; Maybe ritual purposes?; Indus Valley: Mohenjo-daro', ['Great Bath','Mohenjo-daro','Mature Harappan']),
(3,101,'image177.jpeg',None,'Identify the vessel form and the tomb/site it came from. Give its approximate period.', 'An owl-shaped zun from Fu Hao’s tomb at Yinxu, Anyang, Henan; late Shang, approximately 1200 BCE.', 'Fu Hao’s Tomb; Central Plain: Yinxu; owl; Bird Shape Zun', ['owl zun','owl-shaped zun','Fu Hao','Yinxu','Anyang']),
(3,101,'image179.jpeg',None,'Identify this object, its tomb/site, and approximate period.', 'A bronze yue axe from Fu Hao’s tomb at Yinxu, Anyang, Henan; late Shang, approximately 1200 BCE.', 'Fu Hao’s Tomb; Central Plain: Yinxu; Bronze yue axe', ['bronze yue axe','yue','Fu Hao','Yinxu']),
(3,127,'image218.jpeg',(60,60,350,675),'Identify the vessel, the archaeological site, and its approximate date range.', 'A perforated terracotta jar from Harappa, approximately 2500–2000 BCE. The lecture uses ceramics to discuss preservation, relative dating, and cultural and economic choices.', 'Perforated Jar; Harappa; Circa 2500-2000 BCE; Terracotta; National Museum, New Delhi', ['perforated jar','Harappa']),
]
questions=[]
for index,(lesson,page,media,crop,question,answer,evidence,accepted) in enumerate(ROWS,1):
 with zipfile.ZipFile(Path.home()/'Downloads'/FILES[lesson]) as z:
  im=Image.open(io.BytesIO(z.read('ppt/media/'+media))).convert('RGB')
 if crop:im=im.crop(crop)
 im.thumbnail((1200,1200))
 name=f'q-{index:03}.webp';im.save(OUT/name,quality=88)
 item={'id':f'visual-{index:03}','kind':'image','question':question,'image':{'src':'/quiz1/'+name,'width':im.width,'height':im.height,'alt':'Course image for identification practice'},'answer':answer,'evidence':evidence,'source':source(lesson,page),'acceptedAnswers':accepted}
 if index==9:item['additionalSources']=[source(3,24)]
 if index in [10,11]:item['additionalSources']=[source(3,96),source(3,33)]
 questions.append(item)
def gitjson(path):return json.loads(subprocess.check_output(['git','show','HEAD:'+path],cwd=ARCHIVE))
geo=gitjson('data/natural-earth-countries.geojson')
sites={s['site_id']:s for s in gitjson('data/sites.yml')['sites']}
evidence={s['site_id']:s for s in gitjson('docs/intake/gazetteer-evidence.json')['sites']}
MAPS=[('mohenjo-daro',3,45,(57,5,92,40),'Mohenjo-daro, in Sindh, Pakistan.','Sindh, Pakistan; Indus Valley: Mohenjo-daro'),('harappa',3,76,(57,5,92,40),'Harappa, in Punjab, Pakistan.','Punjab, Pakistan; Indus Valley: Harappa'),('erlitou',3,62,(93,17,129,48),'Erlitou, in the Yiluo Basin near Luoyang, China.','Yiluo Basin, Luoyang; Central Plain: Erlitou'),('yinxu',3,92,(93,17,129,48),'Yinxu, at Anyang in Henan, China.','Anyang, Henan; Central Plain: Yinxu'),('uruk',2,33,(22,19,62,45),'Uruk (Warka), in southern Mesopotamia, present-day Iraq.','First City: Uruk (or Warka); Sumerian City-State'),('giza',2,79,(22,19,62,45),'Giza Necropolis, in Egypt.','Giza Necropolis; c. 26th century BCE')]
for index,(sid,lesson,page,bounds,answer,quote) in enumerate(MAPS,13):
 s=sites[sid];ev=evidence[sid]
 assert abs(s['lat']-ev['latitude'])<1e-8 and abs(s['lon']-ev['longitude'])<1e-8
 lo,la,hi,ha=bounds;W,H=1000,720;pad=45
 def project(x,y):return (pad+(x-lo)/(hi-lo)*(W-2*pad),H-pad-(y-la)/(ha-la)*(H-2*pad))
 svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="720" viewBox="0 0 1000 720">','<rect width="1000" height="720" fill="#e4eef0"/>','<defs><clipPath id="frame"><rect x="25" y="25" width="950" height="670" rx="16"/></clipPath></defs>','<g clip-path="url(#frame)">']
 for feat in geo['features']:
  geom=feat['geometry'];polys=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']] if geom['type']=='Polygon' else []
  for poly in polys:
   ring=poly[0]
   if max(x for x,y,*_ in ring)<lo or min(x for x,y,*_ in ring)>hi or max(y for x,y,*_ in ring)<la or min(y for x,y,*_ in ring)>ha:continue
   pts=[project(p[0],p[1]) for p in ring]
   d='M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+' Z'
   svg.append(f'<path d="{d}" fill="#f4f0e4" stroke="#b4b3a8" stroke-width="1.8"/>')
 x,y=project(s['lon'],s['lat']);svg+=['</g>',f'<circle cx="{x:.1f}" cy="{y:.1f}" r="23" fill="#386c52" stroke="white" stroke-width="4"/>',f'<text x="{x:.1f}" y="{y+8:.1f}" text-anchor="middle" font-family="sans-serif" font-size="25" font-weight="700" fill="white">A</text>','<path d="M932 100 V54 L926 64 M932 54 L938 64" fill="none" stroke="#53615c" stroke-width="2"/><text x="932" y="42" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#53615c">N</text>','<rect x="30" y="656" width="680" height="36" rx="8" fill="white" fill-opacity=".9"/><text x="44" y="679" font-family="sans-serif" font-size="15" fill="#53615c">Approximate location · Modern boundaries · Natural Earth basemap</text>','</svg>']
 name=f'q-{index:03}.svg'
 # These reviewed regional maps include rivers/provinces; keep their richer geography.
 if index not in (15,16) or not (OUT/name).exists():(OUT/name).write_text(''.join(svg))
 questions.append({'id':f'visual-{index:03}','kind':'map','question':'Which course site is marked A? Name the site and its present-day country or region. The marker shows an approximate location.','image':{'src':'/quiz1/'+name,'width':W,'height':H,'alt':'Unlabelled regional map with one point marked A'},'answer':answer,'evidence':quote+f". Approximate coordinate source: {ev['source_revision_url']} (Wikidata P625, retrieved {ev['retrieved_at'][:10]}).",'source':source(lesson,page),'acceptedAnswers':s['aliases']})
(ROOT/'content/quiz1-visual-questions.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(ROWS)} image and {len(MAPS)} map cards.')
