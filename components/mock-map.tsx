'use client';

import { useId, useRef, useState } from 'react';
import { clampMapPoint, mapTargets, type MapPoint, type MockMapTarget } from '../lib/mock-map-data';
import { centroid, compareDrawing, simplifyPath, type MapAnswer, type MapShape } from '../lib/map-drawing';
import './mock-map.css';

type Props = {
  targets: string[];
  answers: Record<string, MapAnswer>;
  onChange: (id: string, answer: MapAnswer) => void;
  revealed: boolean;
  targetDefinitions?: MockMapTarget[];
};

const toolLabels: Record<MapShape, string> = { point: 'Point', line: 'Draw a line (rivers)', area: 'Circle an area (regions, seas)' };
const pointsAttr = (points: MapPoint[]) => points.map(p => `${(p.x * 100).toFixed(2)},${(p.y * 100).toFixed(2)}`).join(' ');

export function MockMap({ targets, answers, onChange, revealed, targetDefinitions = mapTargets }: Props) {
  const id = useId();
  const options = targets.flatMap(target => { const found = targetDefinitions.find(item => item.id === target); return found ? [found] : []; });
  const [selected, setSelected] = useState(targets[0] ?? '');
  const [tool, setTool] = useState<MapShape>('point');
  const [drawing, setDrawing] = useState<MapPoint[] | null>(null);
  const drawingRef = useRef<MapPoint[] | null>(null);
  const active = options.find(item => item.id === selected) ?? options[0];
  if (!active) return null;
  const point = answers[active.id] ?? { x: 0.5, y: 0.5 };
  const place = (answer: MapAnswer) => { if (!revealed) onChange(active.id, answer); };
  const relative = (event: React.PointerEvent<HTMLElement>) => { const box = event.currentTarget.getBoundingClientRect(); return clampMapPoint({ x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }); };

  function finishDrawing() {
    const path = simplifyPath(drawingRef.current || []);
    drawingRef.current = null; setDrawing(null);
    if (path.length < 3) return;
    place({ ...centroid(path), shape: tool, path });
  }

  return (
    <section className="mock-map" aria-label="Map exercise">
      <p id={`${id}-help`}>Choose a place, then a tool. <strong>Point</strong>: click its location. <strong>Line</strong>: drag along a river’s course. <strong>Area</strong>: drag around a region or sea. Drawing again replaces your answer for that place.</p>
      <p className="mock-map-print-labels">Mark and label: {options.map(target => target.label).join(', ')}.</p>
      <div className="mock-map-targets" role="group" aria-label="Place to mark">
        {options.map((target, index) => (
          <button type="button" key={target.id} aria-pressed={active.id === target.id} onClick={() => setSelected(target.id)}>
            {index + 1}. {target.label}{answers[target.id] ? ` · ${answers[target.id].shape && answers[target.id].shape !== 'point' ? 'drawn' : 'placed'}` : ''}
          </button>
        ))}
      </div>
      {!revealed && <div className="mock-map-tools" role="group" aria-label="Map tool">
        {(Object.keys(toolLabels) as MapShape[]).map(shape => <button type="button" key={shape} aria-pressed={tool === shape} onClick={() => setTool(shape)}>{toolLabels[shape]}</button>)}
        {answers[active.id] && <button type="button" className="mock-map-clear" onClick={() => place({ x: point.x, y: point.y })}>Keep only a point for {active.label}</button>}
      </div>}
      <div className="mock-map-canvas">
        <button type="button" className={`mock-map-surface tool-${tool}`} disabled={revealed}
          aria-label={tool === 'point' ? `Place ${active.label} on the map` : `Draw ${active.label} on the map with a pointer`} aria-describedby={`${id}-help`}
          onClick={event => {
            if (tool !== 'point') return;
            if (event.detail === 0) { place({ x: point.x, y: point.y }); return; }
            const box = event.currentTarget.getBoundingClientRect();
            place(clampMapPoint({ x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }));
          }}
          onPointerDown={event => { if (tool === 'point' || revealed) return; event.currentTarget.setPointerCapture(event.pointerId); drawingRef.current = [relative(event)]; setDrawing(drawingRef.current); }}
          onPointerMove={event => { if (!drawingRef.current) return; drawingRef.current = [...drawingRef.current, relative(event)]; setDrawing(drawingRef.current); }}
          onPointerUp={() => { if (drawingRef.current) finishDrawing(); }}
          onPointerCancel={() => { drawingRef.current = null; setDrawing(null); }}>
          {/* The map is the original unlabeled quiz image; no remote image requests. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mock-paper/world-map.png" width="537" height="179" alt="Unlabeled outline map of the world, cropped at the south as in Quiz 1" draggable={false} />
        </button>
        <svg className="mock-map-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {revealed && options.map(target => target.guide && (target.guide.kind === 'area'
            ? <polygon key={`g-${target.id}`} className="guide" points={pointsAttr(target.guide.points)} />
            : <polyline key={`g-${target.id}`} className="guide" points={pointsAttr(target.guide.points)} />))}
          {options.map(target => { const answer = answers[target.id]; if (!answer?.path || answer.path.length < 2) return null; return answer.shape === 'area' ? <polygon key={target.id} className={`answer ${target.id === active.id ? 'active' : ''}`} points={pointsAttr(answer.path)} /> : <polyline key={target.id} className={`answer ${target.id === active.id ? 'active' : ''}`} points={pointsAttr(answer.path)} />; })}
          {drawing && drawing.length > 1 && (tool === 'area' ? <polygon className="answer active drawing" points={pointsAttr(drawing)} /> : <polyline className="answer active drawing" points={pointsAttr(drawing)} />)}
        </svg>
        {options.map((target, index) => (
          <span key={target.id}>
            {answers[target.id] && (!answers[target.id].path || answers[target.id].path!.length < 2) && <span className="mock-map-pin mock-map-answer" style={{ left: `${answers[target.id].x * 100}%`, top: `${answers[target.id].y * 100}%` }} aria-hidden="true">{index + 1}</span>}
            {answers[target.id]?.path && answers[target.id].path!.length > 1 && <span className="mock-map-label" style={{ left: `${answers[target.id].x * 100}%`, top: `${answers[target.id].y * 100}%` }} aria-hidden="true">{index + 1}</span>}
            {revealed && <span className="mock-map-pin mock-map-model" style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }} aria-hidden="true">{index + 1}</span>}
          </span>
        ))}
      </div>
      {!revealed && tool === 'point' && <fieldset className="mock-map-position">
        <legend>Position for {active.label}</legend>
        <label>Across: {Math.round(point.x * 100)}% from left
          <input type="range" min="0" max="100" value={Math.round(point.x * 100)} onChange={event => place({ x: Number(event.target.value) / 100, y: point.y })} />
        </label>
        <label>Down: {Math.round(point.y * 100)}% from top
          <input type="range" min="0" max="100" value={Math.round(point.y * 100)} onChange={event => place({ x: point.x, y: Number(event.target.value) / 100 })} />
        </label>
        <button type="button" onClick={() => place({ x: point.x, y: point.y })}>Place {active.label}</button>
      </fieldset>}
      <p className="mock-map-status" role="status">{options.filter(item => answers[item.id]).length} of {options.length} places marked.</p>
      {revealed && <div className="mock-map-feedback">
        <p><strong>Compare your answers:</strong> numbered circles and solid shapes are yours; outlined squares and dashed outlines are approximate guides. Feedback compares your marking with the guide on a coarse pixel grid. The outline map is stylised, so treat it as practice feedback, not a mark.</p>
        <ol>{options.map(target => { const answer = answers[target.id]; const check = answer && target.guide ? compareDrawing(answer, target.guide) : null; return <li key={target.id}><strong>{target.label}:</strong> {check && <span className={`map-check ${check.level}`}>{check.message} </span>}{target.feedback}{!answer && ' You did not mark this place.'}<small>{target.source}</small></li>; })}</ol>
      </div>}
    </section>
  );
}
