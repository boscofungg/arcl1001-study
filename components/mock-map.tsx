'use client';

import { useId, useState } from 'react';
import { clampMapPoint, mapTargets, type MapPoint, type MockMapTarget } from '../lib/mock-map-data';
import './mock-map.css';

type Props = {
  targets: string[];
  answers: Record<string, MapPoint>;
  onChange: (id: string, point: MapPoint) => void;
  revealed: boolean;
  targetDefinitions?: MockMapTarget[];
};

export function MockMap({ targets, answers, onChange, revealed, targetDefinitions=mapTargets }: Props) {
  const id = useId();
  const options = targets.flatMap((target) => {
    const found = targetDefinitions.find((item) => item.id === target);
    return found ? [found] : [];
  });
  const [selected, setSelected] = useState(targets[0] ?? '');
  const active = options.find((item) => item.id === selected) ?? options[0];
  if (!active) return null;
  const point = answers[active.id] ?? { x: 0.5, y: 0.5 };
  const place = (position: MapPoint) => {
    if (!revealed) onChange(active.id, clampMapPoint(position));
  };

  return (
    <section className="mock-map" aria-label="Map placement exercise">
      <p id={`${id}-help`}>Select a place, then click or tap its location on the map. You can also use the position controls below.</p>
      <p className="mock-map-print-labels">Mark and label: {options.map(target=>target.label).join(', ')}.</p>
      <div className="mock-map-targets" role="group" aria-label="Place to mark">
        {options.map((target, index) => (
          <button type="button" key={target.id} aria-pressed={active.id === target.id} onClick={() => setSelected(target.id)}>
            {index + 1}. {target.label}{answers[target.id] ? ' · placed' : ''}
          </button>
        ))}
      </div>
      <div className="mock-map-canvas">
        <button type="button" className="mock-map-surface" disabled={revealed}
          aria-label={`Place ${active.label} on the map`} aria-describedby={`${id}-help`}
          onClick={(event) => {
            if (event.detail === 0) { place(point); return; }
            const box = event.currentTarget.getBoundingClientRect();
            place({ x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height });
          }}>
          {/* The map is the original unlabeled quiz image; no remote image requests. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mock-paper/world-map.png" width="537" height="179" alt="Unlabeled outline map of the world, cropped at the south as in Quiz 1" draggable={false} />
        </button>
        {options.map((target, index) => (
          <span key={target.id}>
            {answers[target.id] && <span className="mock-map-pin mock-map-answer" style={{ left: `${answers[target.id].x * 100}%`, top: `${answers[target.id].y * 100}%` }} aria-hidden="true">{index + 1}</span>}
            {revealed && <span className="mock-map-pin mock-map-model" style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }} aria-hidden="true">{index + 1}</span>}
          </span>
        ))}
      </div>
      {!revealed && <fieldset className="mock-map-position">
        <legend>Position for {active.label}</legend>
        <label>Across: {Math.round(point.x * 100)}% from left
          <input type="range" min="0" max="100" value={Math.round(point.x * 100)} onChange={(event) => place({ ...point, x: Number(event.target.value) / 100 })} />
        </label>
        <label>Down: {Math.round(point.y * 100)}% from top
          <input type="range" min="0" max="100" value={Math.round(point.y * 100)} onChange={(event) => place({ ...point, y: Number(event.target.value) / 100 })} />
        </label>
        <button type="button" onClick={() => place(point)}>Place {active.label}</button>
      </fieldset>}
      <p className="mock-map-status" role="status">{options.filter((item) => answers[item.id]).length} of {options.length} places marked.</p>
      {revealed && <div className="mock-map-feedback">
        <p><strong>Compare your positions:</strong> filled circles are your answers; outlined squares are approximate model locations. Regions and rivers cover an area or course, so this exercise is self-reviewed, not automatically scored by distance.</p>
        <ol>{options.map((target) => <li key={target.id}><strong>{target.label}:</strong> {target.feedback}{!answers[target.id] && ' You did not place this marker.'}<small>{target.source}</small></li>)}</ol>
      </div>}
    </section>
  );
}
