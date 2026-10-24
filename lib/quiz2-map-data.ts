import type { MockMapTarget } from './mock-map-data';

export type Quiz2MapSource = {
  docId: string;
  page: number;
  title: string;
  label: string;
  evidence: string;
};
export type Quiz2MapTarget = MockMapTarget & { sources: Quiz2MapSource[] };

/** Broad self-review guides on world-map.png, never automatic grading boundaries.
 * The source map crops southern South America; the Andes guide is in Peru.
 * Small places such as Hong Kong and Athens cannot be placed precisely at this scale.
 */
export const quiz2MapTargets: Quiz2MapTarget[] = [
  {
    id: 'q2-andes', label: 'Peruvian Andes (Inca region)', x: 0.264, y: 0.84,
    feedback: 'Look along the western side of South America, inland from the Pacific coast in Peru. The Andes extend far beyond this guide point; the map crops their southern extent. Compare the regional map in Lecture 4 before reviewing your placement.',
    source: 'Lecture 4, slides 18 and 21',
    sources: [{docId:'d111',page:18,title:'Lecture 4 — Interacting with the Environment',label:'Slide 18',evidence:'Inca'}, {docId:'d111',page:21,title:'Lecture 4 — Interacting with the Environment',label:'Slide 21',evidence:'Inca Andes'}],
  },
  {
    id: 'q2-maya', label: 'Yucatán Peninsula (northern Maya lowlands)', x: 0.244, y: 0.6,
    feedback: 'Look at southeastern Mexico, on the peninsula projecting between the Gulf of Mexico and the Caribbean Sea. This is the northern Maya lowlands, not the full extent of the Maya region, which also includes areas farther south.',
    source: 'Lecture 4, slide 8',
    sources: [{docId:'d111',page:8,title:'Lecture 4 — Interacting with the Environment',label:'Slide 8',evidence:'Yucatán Peninsula Dry Northern Lowlands'}],
  },
  {
    id: 'q2-persepolis', label: 'Persepolis region (Iran)', x: 0.594, y: 0.528,
    feedback: 'Look in southwestern Iran, inland to the northeast of the Persian Gulf. Use the Lecture 5 regional map to distinguish this area from the Arabian Peninsula across the Gulf. This marker indicates the region around Persepolis, not an exact site boundary.',
    source: 'Lecture 5, slides 48–49',
    sources: [{docId:'d114',page:49,title:'Lecture 5 — Visual Power',label:'Slide 49',evidence:'What is the possible motivation behind building Persepolis here?'}],
  },
  {
    id: 'q2-athens', label: 'Athens region (Greece)', x: 0.512, y: 0.447,
    feedback: 'Look in southeastern mainland Greece, beside the Aegean Sea in the eastern Mediterranean. The Acropolis is in Athens. This small-scale world map only supports an approximate regional placement.',
    source: 'Lecture 5, slides 11 and 60',
    sources: [{docId:'d114',page:11,title:'Lecture 5 — Visual Power',label:'Slide 11',evidence:'Region 2 Greece'}, {docId:'d114',page:60,title:'Lecture 5 — Visual Power',label:'Slide 60',evidence:'Acropolis of Athens'}],
  },
  {
    id: 'q2-hong-kong', label: 'Hong Kong region', x: 0.765, y: 0.57,
    feedback: 'Look on the southern coast of China, east of the Pearl River estuary and west of Taiwan. Hong Kong is too small to mark exactly on this world map: compare the regional lecture maps and treat the marker as a guide to the coastal region.',
    source: 'Lecture 6, slides 54–58',
    sources: [{docId:'d122',page:58,title:'Lecture 6 — Food and Foodways',label:'Slide 58',evidence:'Hong Kong Island 1841'}],
  },
  {
    id: 'q2-denmark', label: 'Denmark (Ribe region)', x: 0.482, y: 0.267,
    feedback: 'Look in northern Europe, on the peninsula north of Germany and south of Norway. Ribe is in western Denmark. This point is a broad Denmark guide; it does not stand for all of Scandinavia.',
    source: 'Lecture 7, slides 6 and 112',
    sources: [{docId:'d123',page:6,title:'Lecture 7 — Violence',label:'Slide 6',evidence:'modern Denmark Sweden and northern Germany'}, {docId:'d123',page:112,title:'Lecture 7 — Violence',label:'Slide 112',evidence:'Ribe Denmark'}],
  },
];

export const mapSets: string[][] = [
  ['q2-andes', 'q2-athens', 'q2-hong-kong'],
  ['q2-maya', 'q2-persepolis', 'q2-denmark'],
  ['q2-andes', 'q2-persepolis', 'q2-denmark'],
];
