import type { Quiz2MapTarget } from './quiz2-map-data';
import { ellipse } from './map-drawing.ts';

export type Quiz3MapTarget = Quiz2MapTarget;

const L8 = 'Lecture 8 — Tracing Nomads', L9 = 'Lecture 9 — Politics and Religion';
const L10 = 'Lecture 10 — Indigenous and Historical Archaeology in North America', L11 = 'Lecture 11 — Production and Trade in Africa';

/** Broad self-review guides for Lectures 8–11 on world-map.png, never automatic grading boundaries.
 * Positions were placed against the outline map's own coastlines (Caspian Sea, Bay of Bengal, Java,
 * Gulf of Mexico, Madagascar); small places are regional guides only at this scale.
 */
export const quiz3MapTargets: Quiz3MapTarget[] = [
  {
    id: 'q3-botai', label: 'Botai (northern Kazakhstan)', x: 0.638, y: 0.29,
    feedback: 'Look in northern Kazakhstan on the Kazakh steppe, well east of the Caspian Sea and south of the Russian forest zone. The marker is a regional guide to the Botai settlement area.',
    source: 'Lecture 8, slides 13 and 52',
    guide: { kind: 'area', points: ellipse(0.638, 0.29, 0.025, 0.06) },
    sources: [{ docId: 'd124', page: 52, title: L8, label: 'Slide 52', evidence: 'Botai, Kazakhstan' }, { docId: 'd124', page: 13, title: L8, label: 'Slide 13', evidence: 'Kazakh Steppe' }],
  },
  {
    id: 'q3-tuva', label: 'Tuva (Arzhan 2)', x: 0.716, y: 0.3,
    feedback: 'Look in southern Siberia, directly north of western Mongolia, near the Altai and Sayan mountains. Arzhan 2 is in Tuva; the marker shows the region, not the kurgan itself.',
    source: 'Lecture 8, slides 73 and 79',
    guide: { kind: 'area', points: ellipse(0.716, 0.3, 0.022, 0.055) },
    sources: [{ docId: 'd124', page: 79, title: L8, label: 'Slide 79', evidence: 'Arzhan 2 Tuva' }],
  },
  {
    id: 'q3-bagan', label: 'Bagan (central Myanmar)', x: 0.715, y: 0.575,
    feedback: 'Look east of the Bay of Bengal, inland in central Myanmar on the Irrawaddy River in the dry zone. Thailand and Cambodia lie farther southeast.',
    source: 'Lecture 9, slides 54 and 65',
    guide: { kind: 'area', points: ellipse(0.715, 0.575, 0.012, 0.035) },
    sources: [{ docId: 'd126', page: 54, title: L9, label: 'Slide 54', evidence: 'Bagan, Myanmar' }, { docId: 'd126', page: 65, title: L9, label: 'Slide 65', evidence: 'Upper Myanmar: Dry zone' }],
  },
  {
    id: 'q3-angkor', label: 'Angkor (Cambodia)', x: 0.745, y: 0.65,
    feedback: 'Look in mainland Southeast Asia, in Cambodia north of the Gulf of Thailand and west of the Mekong Delta in southern Vietnam.',
    source: 'Lecture 9, slides 74 and 76',
    guide: { kind: 'area', points: ellipse(0.745, 0.65, 0.012, 0.035) },
    sources: [{ docId: 'd126', page: 74, title: L9, label: 'Slide 74', evidence: 'Angkor Wat, Cambodia' }],
  },
  {
    id: 'q3-java', label: 'Central Java (Borobudur)', x: 0.763, y: 0.815,
    feedback: 'Look at the long island south of Borneo and southeast of Sumatra: Java, Indonesia. Borobudur is in the centre of the island on the Kedu Plain.',
    source: 'Lecture 9, slides 27 and 34',
    guide: { kind: 'area', points: ellipse(0.763, 0.815, 0.018, 0.03) },
    sources: [{ docId: 'd126', page: 27, title: L9, label: 'Slide 27', evidence: 'Borobudur, Indonesia' }, { docId: 'd126', page: 34, title: L9, label: 'Slide 34', evidence: 'fertile Kedu Plain' }],
  },
  {
    id: 'q3-cahokia', label: 'Cahokia (Mississippi valley, Illinois)', x: 0.2225, y: 0.42,
    feedback: 'Look in the interior of the United States, north of the Gulf of Mexico along the Mississippi River, near modern St Louis. Cahokia sits on the river floodplain in Illinois.',
    source: 'Lecture 10, slides 62 and 69',
    guide: { kind: 'area', points: ellipse(0.2225, 0.42, 0.015, 0.045) },
    sources: [{ docId: 'd128', page: 62, title: L10, label: 'Slide 62', evidence: 'Cahokia, Monks Mound' }, { docId: 'd128', page: 69, title: L10, label: 'Slide 69', evidence: 'settlements in floodplain expand' }],
  },
  {
    id: 'q3-mackinac', label: 'Straits of Mackinac (Michigan)', x: 0.2375, y: 0.352,
    feedback: 'Look at the Great Lakes on the US–Canada border: the Straits of Mackinac join Lake Michigan and Lake Huron at the northern tip of Michigan’s lower peninsula. This outline map does not draw the lakes, so treat the marker as a regional guide.',
    source: 'Lecture 10, slides 91 and 97',
    guide: { kind: 'area', points: ellipse(0.2375, 0.352, 0.015, 0.04) },
    sources: [{ docId: 'd128', page: 91, title: L10, label: 'Slide 91', evidence: 'Lake Michigan Lake Huron' }, { docId: 'd128', page: 97, title: L10, label: 'Slide 97', evidence: 'Straits of Mackinac' }],
  },
  {
    id: 'q3-homolovi', label: 'Northern Arizona (Homolovi, Hopi lands)', x: 0.1725, y: 0.45,
    feedback: 'Look in the southwestern United States, inland and northeast of the Gulf of California. Homolovi is in northern Arizona near the Hopi Nation; the Grand Canyon is in the same state.',
    source: 'Lecture 10, slides 41 and 46',
    guide: { kind: 'area', points: ellipse(0.1725, 0.45, 0.018, 0.045) },
    sources: [{ docId: 'd128', page: 41, title: L10, label: 'Slide 41', evidence: "Homol'Ovi II Archaeological Site" }, { docId: 'd128', page: 46, title: L10, label: 'Slide 46', evidence: 'controlled by Arizonia state government' }],
  },
  {
    id: 'q3-tadmekka', label: 'Essouk-Tadmekka (Mali)', x: 0.46, y: 0.6,
    feedback: 'Look in West Africa on the southern edge of the Sahara, in northeastern Mali, south of Algeria. The marker is a regional guide to the town on trans-Saharan routes.',
    source: 'Lecture 11, slides 24 and 26',
    guide: { kind: 'area', points: ellipse(0.46, 0.6, 0.022, 0.06) },
    sources: [{ docId: 'd131', page: 24, title: L11, label: 'Slide 24', evidence: 'Essouk-Tadmekka, Mali' }],
  },
  {
    id: 'q3-phalaborwa', label: 'Phalaborwa (Lowveld, South Africa)', x: 0.55, y: 0.945,
    feedback: 'Look in northeastern South Africa, inland from the Mozambique coast and west of Madagascar, beside Kruger National Park. The outline map crops southern Africa, so Phalaborwa sits near its lower edge.',
    source: 'Lecture 11, slides 51 and 54',
    guide: { kind: 'area', points: ellipse(0.55, 0.945, 0.015, 0.045) },
    sources: [{ docId: 'd131', page: 51, title: L11, label: 'Slide 51', evidence: 'Phalaborwa (in the Lowveld), South Africa' }, { docId: 'd131', page: 54, title: L11, label: 'Slide 54', evidence: 'Kruger National Park' }],
  },
];

/** Each set mixes three of the four lectures. */
export const quiz3MapSets: string[][] = [
  ['q3-botai', 'q3-angkor', 'q3-cahokia'],
  ['q3-tuva', 'q3-java', 'q3-tadmekka'],
  ['q3-bagan', 'q3-mackinac', 'q3-phalaborwa'],
  ['q3-homolovi', 'q3-botai', 'q3-tadmekka'],
];
