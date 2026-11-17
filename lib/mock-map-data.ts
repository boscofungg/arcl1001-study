export type MapPoint = { x: number; y: number };
export type MockMapTarget = MapPoint & {
  id: string;
  label: string;
  feedback: string;
  source: string;
  /** Approximate guide shape for drawn answers (see lib/map-drawing.ts). */
  guide?: { kind: 'line' | 'area'; points: MapPoint[] };
};

import { ellipse } from './map-drawing.ts';

/** Approximate guide points on the original Quiz 1 map, not grading boundaries. */
export const mapTargets: MockMapTarget[] = [
  { id: 'south-america', label: 'South America', x: 0.3, y: 0.82, feedback: 'South America is the continent below Central America, west of the Atlantic. The original quiz map crops its southern end.', source: 'Quiz 1, map task', guide: { kind: 'area', points: [{x:.245,y:.66},{x:.30,y:.62},{x:.37,y:.72},{x:.36,y:.8},{x:.32,y:.99},{x:.27,y:.99},{x:.25,y:.8}] } },
  { id: 'tigris', label: 'Tigris River', x: 0.553, y: 0.495, feedback: 'The Tigris runs from southeastern Turkey through Iraq towards the Persian Gulf. This point indicates its approximate middle course; a river is a line, not a single point.', source: 'Quiz 1, map task', guide: { kind: 'line', points: [{x:.545,y:.46},{x:.56,y:.5},{x:.575,y:.55}] } },
  { id: 'yellow-river', label: 'Yellow River', x: 0.795, y: 0.48, feedback: 'The Yellow River is in northern China and flows towards the Bohai Sea. This point indicates its approximate lower course; a river is a line, not a single point.', source: 'Quiz 1, map task', guide: { kind: 'line', points: [{x:.735,y:.47},{x:.75,y:.42},{x:.77,y:.38},{x:.775,y:.43},{x:.79,y:.45},{x:.8,y:.44}] } },
  { id: 'egypt', label: 'Egypt', x: 0.515, y: 0.57, feedback: 'Egypt is in northeastern Africa, around the lower Nile and immediately west of the Red Sea.', source: 'Lecture 2, slide 16', guide: { kind: 'area', points: ellipse(.515, .57, .025, .06) } },
  { id: 'indus', label: 'Indus Valley', x: 0.65, y: 0.575, feedback: 'The Indus Valley lies mainly in modern Pakistan, northwest of the Indian subcontinent. This marker represents the region, not the entire extent of the civilization.', source: 'Lecture 3, slide 13', guide: { kind: 'area', points: ellipse(.65, .575, .02, .05) } },
  { id: 'mesopotamia', label: 'Mesopotamia', x: 0.552, y: 0.52, feedback: 'Mesopotamia is the region between and around the Tigris and Euphrates, largely in modern Iraq. The marker is an approximate regional guide.', source: 'Lecture 2, slides 12–13', guide: { kind: 'area', points: ellipse(.552, .52, .02, .05) } },
];

export function clampMapPoint(point: MapPoint): MapPoint {
  return {
    x: Number.isFinite(point.x) ? Math.max(0, Math.min(1, point.x)) : 0.5,
    y: Number.isFinite(point.y) ? Math.max(0, Math.min(1, point.y)) : 0.5,
  };
}
