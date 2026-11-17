/**
 * Cross-lecture timeline, regional links and method examples.
 * Every entry cites the lecture slide where its date or claim appears (checked against
 * lib/visuals.json text). Years: negative = BCE, positive = CE; "start"/"end" are
 * approximate as stated on the slide ("c.", "ca", "~").
 */
export type Region = 'Africa' | 'Southwest Asia' | 'South Asia' | 'East Asia' | 'Southeast Asia' | 'Europe & Mediterranean' | 'Central Asian steppe' | 'Mesoamerica' | 'South America' | 'North America';
export type Theme = 'cities' | 'hierarchy' | 'religion' | 'environment' | 'power' | 'mobility' | 'colonialism' | 'food';
export type SlideRef = { docId: string; page: number };
export type TimelineEvent = { id: string; label: string; date: string; start: number; end?: number; week: number; region: Region; themes: Theme[]; source: SlideRef };

export const regions: Region[] = ['Southwest Asia', 'Africa', 'Europe & Mediterranean', 'South Asia', 'East Asia', 'Southeast Asia', 'Central Asian steppe', 'Mesoamerica', 'South America', 'North America'];

export const themes: Record<Theme, { label: string; question: string }> = {
  cities: { label: 'Cities and urban life', question: 'What makes a settlement a city, and how do different regions answer that question?' },
  hierarchy: { label: 'Social hierarchy and burial', question: 'How do burials and buildings reveal (or fail to prove) inequality?' },
  religion: { label: 'Religion and monuments', question: 'How do archaeologists separate ritual evidence from assumptions about belief?' },
  environment: { label: 'Environment and climate', question: 'How did communities adapt to, or struggle with, environmental change?' },
  power: { label: 'Power and visual display', question: 'How did rulers use buildings, images and objects to show authority?' },
  mobility: { label: 'Mobility, nomads and migration', question: 'Why are mobile communities hard to see archaeologically, and what evidence helps?' },
  colonialism: { label: 'Colonialism and whose past', question: 'Whose perspectives shape the story, and how can Indigenous voices change interpretation?' },
  food: { label: 'Food and exchange', question: 'What can food remains and traded objects tell us about everyday life and contact?' },
};

export const timeline: TimelineEvent[] = [
  { id: 'gobekli', label: 'Göbekli Tepe (early religious site?)', date: 'c. 9500–8000 BCE', start: -9500, end: -8000, week: 1, region: 'Southwest Asia', themes: ['religion'], source: { docId: 'd101', page: 77 } },
  { id: 'catalhoyuk', label: 'Çatalhöyük settlement', date: 'c. 7400–5200 BCE', start: -7400, end: -5200, week: 2, region: 'Southwest Asia', themes: ['cities'], source: { docId: 'd102', page: 19 } },
  { id: 'hk-welch', label: 'Welch site, Kau Sai Chau — Hong Kong’s earliest confirmed site', date: '5200–4800 BCE', start: -5200, end: -4800, week: 6, region: 'East Asia', themes: ['food'], source: { docId: 'd122', page: 62 } },
  { id: 'uruk', label: 'Uruk: urban development starts', date: 'c. 3800–3700 BCE', start: -3800, end: -3700, week: 2, region: 'Southwest Asia', themes: ['cities'], source: { docId: 'd102', page: 37 } },
  { id: 'botai', label: 'Botai settlement (horses)', date: 'c. 3700–3100 BCE', start: -3700, end: -3100, week: 8, region: 'Central Asian steppe', themes: ['mobility', 'food'], source: { docId: 'd124', page: 51 } },
  { id: 'writing', label: 'Writing systems in Mesopotamia and Egypt', date: '3200 BCE', start: -3200, week: 2, region: 'Southwest Asia', themes: ['cities', 'power'], source: { docId: 'd102', page: 10 } },
  { id: 'harappan', label: 'Mature Harappan period (Mohenjo-daro, Harappa)', date: 'c. 2600–1900 BCE', start: -2600, end: -1900, week: 3, region: 'South Asia', themes: ['cities', 'hierarchy'], source: { docId: 'd103', page: 24 } },
  { id: 'giza', label: 'Giza pyramids for pharaohs', date: 'ca 2560–2510 BCE', start: -2560, end: -2510, week: 2, region: 'Africa', themes: ['hierarchy', 'power', 'religion'], source: { docId: 'd102', page: 81 } },
  { id: 'sintashta', label: 'Sintashta culture and the 4.2 ka climate event', date: '~2350–1950 BCE', start: -2350, end: -1950, week: 8, region: 'Central Asian steppe', themes: ['environment', 'mobility'], source: { docId: 'd124', page: 62 } },
  { id: 'erlitou', label: 'Erlitou period', date: 'c. 1900–1600 BCE', start: -1900, end: -1600, week: 3, region: 'East Asia', themes: ['cities', 'hierarchy'], source: { docId: 'd103', page: 30 } },
  { id: 'fuhao', label: 'Fu Hao’s tomb (consort of King Wu Ding)', date: 'ca 1200 BCE', start: -1200, week: 3, region: 'East Asia', themes: ['hierarchy'], source: { docId: 'd103', page: 96 } },
  { id: 'rice-japan', label: 'Wet-rice cultivation reaches Japan via Korea', date: 'ca 1000 BCE', start: -1000, week: 6, region: 'East Asia', themes: ['food', 'mobility'], source: { docId: 'd122', page: 24 } },
  { id: 'calakmul', label: 'Calakmul (Maya)', date: '600 BCE–900 CE', start: -600, end: 900, week: 4, region: 'Mesoamerica', themes: ['cities', 'environment'], source: { docId: 'd111', page: 7 } },
  { id: 'persepolis', label: 'Persepolis founded by Darius; destroyed by Alexander 330 BCE', date: 'ca 500–330 BCE', start: -500, end: -330, week: 5, region: 'Southwest Asia', themes: ['power'], source: { docId: 'd114', page: 53 } },
  { id: 'parthenon', label: 'Parthenon built in Athens', date: 'c. 447–432 BCE', start: -447, end: -432, week: 5, region: 'Europe & Mediterranean', themes: ['power', 'religion'], source: { docId: 'd114', page: 69 } },
  { id: 'xiongnu', label: 'Xiongnu Empire founded by Modu Chanyu', date: '209 BCE', start: -209, end: 89, week: 8, region: 'Central Asian steppe', themes: ['mobility', 'power'], source: { docId: 'd124', page: 37 } },
  { id: 'moche-nazca', label: 'Nazca, Moche, Wari and Chimu before the Inca', date: '200 BCE–1470 CE', start: -200, end: 1470, week: 4, region: 'South America', themes: ['environment'], source: { docId: 'd111', page: 20 } },
  { id: 'migration', label: 'Migration Period in Europe', date: '~300–700 CE', start: 300, end: 700, week: 7, region: 'Europe & Mediterranean', themes: ['mobility'], source: { docId: 'd123', page: 113 } },
  { id: 'tikal', label: 'Tikal, Guatemala (example date)', date: '732 CE', start: 732, week: 1, region: 'Mesoamerica', themes: ['cities'], source: { docId: 'd101', page: 21 } },
  { id: 'vendel', label: 'Vendel-period mound burials (Uppsala)', date: 'c. 550–790 CE', start: 550, end: 790, week: 7, region: 'Europe & Mediterranean', themes: ['hierarchy'], source: { docId: 'd123', page: 93 } },
  { id: 'borobudur', label: 'Borobudur (Sailendra dynasty)', date: 'c. 750–850 CE', start: 750, end: 850, week: 9, region: 'Southeast Asia', themes: ['religion', 'power'], source: { docId: 'd126', page: 31 } },
  { id: 'viking', label: 'Viking period', date: '~793–1066 CE', start: 793, end: 1066, week: 7, region: 'Europe & Mediterranean', themes: ['mobility'], source: { docId: 'd123', page: 5 } },
  { id: 'maya-collapse', label: 'Maya collapse (drought?)', date: 'ca 900 CE', start: 900, week: 4, region: 'Mesoamerica', themes: ['environment'], source: { docId: 'd111', page: 13 } },
  { id: 'cahokia', label: 'Cahokia, Monks Mound', date: 'ca 900–1150 CE', start: 900, end: 1150, week: 10, region: 'North America', themes: ['cities', 'hierarchy', 'religion'], source: { docId: 'd128', page: 62 } },
  { id: 'bagan', label: 'Bagan becomes capital of the Pagan Empire', date: '849 CE', start: 849, end: 1300, week: 9, region: 'Southeast Asia', themes: ['religion', 'power'], source: { docId: 'd126', page: 59 } },
  { id: 'khmer', label: 'Khmer Empire founded; capital at Angkor', date: '9th century CE', start: 800, end: 1431, week: 9, region: 'Southeast Asia', themes: ['religion', 'power'], source: { docId: 'd126', page: 77 } },
  { id: 'oraibi', label: 'Hopi village of Oraibi founded', date: 'before 1100 CE', start: 1100, week: 10, region: 'North America', themes: ['colonialism'], source: { docId: 'd128', page: 35 } },
  { id: 'angkor-wat', label: 'Angkor Wat commissioned by Suryavarman II', date: 'early 12th century CE', start: 1113, end: 1149, week: 9, region: 'Southeast Asia', themes: ['religion', 'power'], source: { docId: 'd126', page: 83 } },
  { id: 'mongol', label: 'Mongol Empire (Genghis Khan r. 1206–1227)', date: '1206–1368 CE', start: 1206, end: 1368, week: 8, region: 'Central Asian steppe', themes: ['mobility', 'power'], source: { docId: 'd124', page: 41 } },
  { id: 'homolovi', label: 'Homolovi I and II (Hopi ancestral sites)', date: 'ca 1290–1400 CE', start: 1290, end: 1400, week: 10, region: 'North America', themes: ['mobility', 'colonialism'], source: { docId: 'd128', page: 43 } },
  { id: 'iroquois', label: 'Formation of the Iroquois Confederacy', date: '1350–1600', start: 1350, end: 1600, week: 10, region: 'North America', themes: ['power'], source: { docId: 'd128', page: 13 } },
  { id: 'inca', label: 'Inca Imperial Period', date: '1438–1525 CE', start: 1438, end: 1525, week: 4, region: 'South America', themes: ['environment', 'power'], source: { docId: 'd111', page: 6 } },
  { id: 'columbus', label: 'Columbus reaches America', date: '1492 CE', start: 1492, week: 10, region: 'North America', themes: ['colonialism'], source: { docId: 'd128', page: 13 } },
  { id: 'williamsburg', label: 'Williamsburg, capital of the Virginia Colony', date: '1632–1780', start: 1632, end: 1780, week: 10, region: 'North America', themes: ['colonialism'], source: { docId: 'd128', page: 18 } },
  { id: 'michilimackinac', label: 'Fort Michilimackinac (French, then British)', date: '1715–1781', start: 1715, end: 1781, week: 10, region: 'North America', themes: ['colonialism'], source: { docId: 'd128', page: 94 } },
];

/** Methods with a worked example from a lecture, answering "how do we know?". */
export const methods: { id: string; name: string; what: string; example: string; source: SlideRef }[] = [
  { id: 'stratigraphy', name: 'Stratigraphy', what: 'Layers build up over time: deeper is older (relative dating).', example: 'Fu Hao’s tomb: the burial chamber and later memorial hall are read through stratigraphy.', source: { docId: 'd103', page: 97 } },
  { id: 'context', name: 'Context: provenience, matrix, association', what: 'Where an object was found, in what soil, and with what other objects.', example: 'Lecture 2 defines provenience, matrix and association before interpreting urban finds.', source: { docId: 'd102', page: 47 } },
  { id: 'lidar', name: 'LiDAR survey', what: 'Laser scanning that reveals landforms under vegetation.', example: 'Cahokia’s Grand Plaza (20 hectares) and mounds mapped with LiDAR.', source: { docId: 'd128', page: 72 } },
  { id: 'residue', name: 'Residue analysis', what: 'Chemical traces of food or other substances on tools and pots.', example: 'Botai: organic residue and cut marks show horse consumption, including bone grease.', source: { docId: 'd124', page: 56 } },
  { id: 'pollen', name: 'Pollen analysis', what: 'Preserved pollen shows which plants were present or stored.', example: 'Machu Picchu storehouses: maize, potatoes and quinoa identified.', source: { docId: 'd111', page: 65 } },
  { id: 'isotopes', name: 'Stable isotopes and palaeopathology', what: 'Tooth enamel isotopes indicate childhood origin and diet; bones show disease.', example: 'Lecture 7 bioarchaeology: strontium and oxygen for origin, carbon and nitrogen for diet.', source: { docId: 'd123', page: 29 } },
  { id: 'adna', name: 'Ancient DNA', what: 'Genetic data show relationships between individuals or animals.', example: 'Botai horses: DNA analysis questions whether they were domesticated or corralled.', source: { docId: 'd124', page: 57 } },
  { id: 'zooarch', name: 'Zooarchaeology', what: 'Study of animal remains and human–animal relationships.', example: 'Used for nomadic sites where architecture is scarce.', source: { docId: 'd124', page: 47 } },
  { id: 'ethnography', name: 'Ethnography and Indigenous perspectives', what: 'Living communities’ knowledge and accounts help interpret the past, with care about bias.', example: 'Lecture 10 contrasts ethnographic accounts with a decolonizing perspective (Mescalero Apache).', source: { docId: 'd128', page: 51 } },
];

export function formatYear(year: number): string {
  return year < 0 ? `${-year} BCE` : `${year} CE`;
}
