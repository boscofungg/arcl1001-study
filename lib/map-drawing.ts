/**
 * Freehand map answers (lines along rivers, circled regions) and approximate
 * "pixel mapping" feedback: the map is divided into a coarse grid, the guide shape and
 * the student's drawing are rasterised onto it, and their overlap is compared.
 * Guides are hand-placed on the stylised outline map, so feedback is a practice aid,
 * not a mark.
 */
import type { MapPoint } from './mock-map-data.ts';

export type MapShape = 'point' | 'line' | 'area';
export type MapAnswer = MapPoint & { shape?: MapShape; path?: MapPoint[] };
export type MapGuide = { kind: 'line' | 'area'; points: MapPoint[] };

export const GRID_W = 108;
export const GRID_H = 36;
const MAX_PATH = 400;

export function ellipse(cx: number, cy: number, rx: number, ry: number, steps = 24): MapPoint[] {
  return Array.from({ length: steps }, (_, i) => ({ x: cx + rx * Math.cos((i / steps) * 2 * Math.PI), y: cy + ry * Math.sin((i / steps) * 2 * Math.PI) }));
}

export function simplifyPath(points: MapPoint[], minStep = 0.004): MapPoint[] {
  const out: MapPoint[] = [];
  for (const point of points) {
    const clamped = { x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) };
    const last = out.at(-1);
    if (!last || Math.hypot(clamped.x - last.x, clamped.y - last.y) >= minStep) out.push(clamped);
  }
  return out.slice(0, MAX_PATH);
}

export function centroid(points: MapPoint[]): MapPoint {
  if (!points.length) return { x: 0.5, y: 0.5 };
  return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length, y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
}

function inside(point: MapPoint, polygon: MapPoint[]): boolean {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}

function segmentDistance(p: MapPoint, a: MapPoint, b: MapPoint): number {
  // Measure in grid units so horizontal and vertical tolerance match the cell shape.
  const px = p.x * GRID_W, py = p.y * GRID_H, ax = a.x * GRID_W, ay = a.y * GRID_H, bx = b.x * GRID_W, by = b.y * GRID_H;
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Set of grid cells ("pixels") covered by a shape. Lines get `tolerance` cells either side. */
export function rasterise(kind: 'line' | 'area', points: MapPoint[], tolerance = 1.5): Set<number> {
  const cells = new Set<number>();
  if (!points.length) return cells;
  const segments = points.map((point, i) => [point, points[(i + 1) % points.length]] as const).slice(0, kind === 'area' ? points.length : Math.max(1, points.length - 1));
  for (let gy = 0; gy < GRID_H; gy++) for (let gx = 0; gx < GRID_W; gx++) {
    const centre = { x: (gx + 0.5) / GRID_W, y: (gy + 0.5) / GRID_H };
    const near = segments.some(([a, b]) => segmentDistance(centre, a, b) <= tolerance);
    if (near || (kind === 'area' && points.length > 2 && inside(centre, points))) cells.add(gy * GRID_W + gx);
  }
  return cells;
}

export type DrawingFeedback = { level: 'good' | 'partial' | 'off'; precision: number; coverage: number; message: string };

export function compareDrawing(answer: MapAnswer, guide: MapGuide): DrawingFeedback {
  const target = rasterise(guide.kind, guide.points, guide.kind === 'line' ? 2 : 1);
  const drawn = answer.path && answer.path.length > 1
    ? rasterise(answer.shape === 'area' ? 'area' : 'line', answer.path, 1)
    : rasterise('line', [answer, answer], 1.2);
  let overlap = 0;
  for (const cell of drawn) if (target.has(cell)) overlap++;
  const precision = drawn.size ? overlap / drawn.size : 0;
  const coverage = target.size ? overlap / target.size : 0;
  const isPoint = !answer.path || answer.path.length < 2;
  const good = isPoint ? precision >= 0.5 : precision >= 0.5 && coverage >= 0.35;
  const partial = isPoint ? precision > 0 : precision >= 0.2 || coverage >= 0.2;
  const level = good ? 'good' : partial ? 'partial' : 'off';
  const shapeWord = guide.kind === 'line' ? 'course' : 'area';
  const message = level === 'good'
    ? `Your ${isPoint ? 'marker' : 'drawing'} matches the guide ${shapeWord} well.`
    : level === 'partial'
      ? `Your ${isPoint ? 'marker' : 'drawing'} partly overlaps the guide ${shapeWord}. Compare with the dashed outline.`
      : `Your ${isPoint ? 'marker' : 'drawing'} is not near the guide ${shapeWord}. Compare with the dashed outline and the lecture map.`;
  return { level, precision, coverage, message };
}

export function validMapAnswer(value: unknown): value is MapAnswer {
  if (!value || typeof value !== 'object') return false;
  const v = value as MapAnswer;
  const okPoint = (p: MapPoint) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
  if (!okPoint(v)) return false;
  if (v.shape !== undefined && !['point', 'line', 'area'].includes(v.shape)) return false;
  if (v.path !== undefined && (!Array.isArray(v.path) || v.path.length > MAX_PATH || !v.path.every(okPoint))) return false;
  return true;
}
