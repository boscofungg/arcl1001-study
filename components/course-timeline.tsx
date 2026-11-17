'use client';

import { useState } from 'react';
import { ArrowRight, Check, RotateCcw, Shuffle } from 'lucide-react';
import { methods, regions, themes, timeline, type Theme, type TimelineEvent } from '@/lib/timeline-data';
import './course-timeline.css';

type Props = {
  focusWeeks: readonly number[] | null;
  onOpen: (docId: string, page: number, quote?: string) => void;
  onAsk: (question: string) => void;
};

const bands = [
  { label: 'Before 3000 BCE', from: -Infinity, to: -3000 },
  { label: '3000–1000 BCE', from: -3000, to: -1000 },
  { label: '1000 BCE–1 CE', from: -1000, to: 1 },
  { label: '1–1000 CE', from: 1, to: 1000 },
  { label: '1000–1500 CE', from: 1000, to: 1500 },
  { label: 'After 1500 CE', from: 1500, to: Infinity },
];
const inBand = (event: TimelineEvent, band: typeof bands[number]) => event.start >= band.from && event.start < band.to;

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

export default function CourseTimeline({ focusWeeks, onOpen, onAsk }: Props) {
  const [theme, setTheme] = useState<Theme | 'all'>('all');
  const [onlyFocus, setOnlyFocus] = useState(false);
  const focus = (event: TimelineEvent) => !focusWeeks || focusWeeks.includes(event.week);
  const events = timeline.filter(event => (theme === 'all' || event.themes.includes(theme)) && (!onlyFocus || focus(event)));
  const usedRegions = regions.filter(region => events.some(event => event.region === region));
  const [order, setOrder] = useState<TimelineEvent[]>([]);
  const [checked, setChecked] = useState(false);
  const pool = timeline;

  function newOrderTask() {
    const focusPool = shuffle(pool.filter(focus)).filter((event, index, list) => list.findIndex(item => item.start === event.start) === index).slice(0, 2);
    // Distinct start years only, so there is exactly one correct order.
    const others = shuffle(pool.filter(event => !focusPool.includes(event))).filter((event, index, list) => !focusPool.some(item => item.start === event.start) && list.findIndex(item => item.start === event.start) === index).slice(0, 4 - focusPool.length);
    setOrder(shuffle([...focusPool, ...others]));
    setChecked(false);
  }
  function move(index: number, delta: number) {
    const next = [...order]; const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next); setChecked(false);
  }
  const correctOrder = [...order].sort((a, b) => a.start - b.start);

  return <section className="course-timeline" aria-labelledby="timeline-title">
    <header>
      <span className="section-kicker">{focusWeeks ? `QUIZ 3 FOCUS · LECTURES ${focusWeeks[0]}–${focusWeeks.at(-1)} · WITH EARLIER LECTURES FOR CONTEXT` : 'ALL LECTURES'}</span>
      <h1 id="timeline-title">Timeline &amp; links</h1>
      <p>See where each lecture sits in time and place, then follow themes across lectures. Every item opens the slide where its date appears.</p>
    </header>

    <div className="timeline-filters">
      <div className="segmented" role="group" aria-label="Theme">
        <button aria-pressed={theme === 'all'} onClick={() => setTheme('all')}>All themes</button>
        {(Object.keys(themes) as Theme[]).map(key => <button key={key} aria-pressed={theme === key} onClick={() => setTheme(key)}>{themes[key].label}</button>)}
      </div>
      {focusWeeks && <label className="timeline-check"><input type="checkbox" checked={onlyFocus} onChange={event => setOnlyFocus(event.target.checked)} /> Only Lectures {focusWeeks[0]}–{focusWeeks.at(-1)}</label>}
    </div>

    {theme !== 'all' && <div className="theme-banner"><p><strong>{themes[theme].label}.</strong> {themes[theme].question}</p><button onClick={() => onAsk(`${themes[theme].question} Compare examples from different lectures and regions, citing the slides.`)}>Ask the tutor to compare <ArrowRight size={15} /></button></div>}

    <div className="timeline-grid-wrap" role="region" aria-label="Region and period grid" tabIndex={0}>
      <table className="timeline-grid">
        <thead><tr><th scope="col">Region</th>{bands.map(band => <th scope="col" key={band.label}>{band.label}</th>)}</tr></thead>
        <tbody>{usedRegions.map(region => <tr key={region}><th scope="row">{region}</th>{bands.map(band => <td key={band.label}>{events.filter(event => event.region === region && inBand(event, band)).sort((a, b) => a.start - b.start).map(event =>
          <button key={event.id} className={`timeline-event ${focus(event) ? 'focus' : 'context'}`} onClick={() => onOpen(event.source.docId, event.source.page, event.date)}>
            <span className="event-week">L{event.week}</span><strong>{event.label}</strong><small>{event.date}</small>
          </button>)}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <p className="timeline-legend"><span className="swatch focus" /> {focusWeeks ? `Lectures ${focusWeeks[0]}–${focusWeeks.at(-1)}` : 'Lecture item'} <span className="swatch context" /> Earlier lectures for context. Dates are as given on the slides (“c.”/“ca” = approximately).</p>

    <section className="timeline-order" aria-labelledby="order-title">
      <h2 id="order-title">Put them in order</h2>
      <p>Arrange four dated items from earliest to latest. This practises BCE/CE reasoning across lectures.</p>
      {!order.length ? <button className="primary" onClick={newOrderTask}><Shuffle size={16} /> Start an ordering task</button> : <>
        <ol>{order.map((event, index) => <li key={event.id} className={checked ? (correctOrder[index].id === event.id ? 'right' : 'wrong') : ''}>
          <span><strong>{event.label}</strong><small>L{event.week} · {event.region}{checked ? ` · ${event.date}` : ''}</small></span>
          <span className="order-buttons"><button aria-label={`Move ${event.label} earlier`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button aria-label={`Move ${event.label} later`} disabled={index === order.length - 1} onClick={() => move(index, 1)}>↓</button></span>
        </li>)}</ol>
        <div className="order-actions">{!checked ? <button className="primary" onClick={() => setChecked(true)}><Check size={16} /> Check order</button> : <p role="status">{order.every((event, index) => correctOrder[index].id === event.id) ? 'All in the right order.' : `Correct order: ${correctOrder.map(event => `${event.label} (${event.date})`).join(' → ')}.`}</p>}<button onClick={newOrderTask}><RotateCcw size={16} /> New set</button></div>
      </>}
    </section>

    <section className="timeline-methods" aria-labelledby="methods-title">
      <h2 id="methods-title">How do we know? Methods in action</h2>
      <p>Use these as examples when a short answer or discussion asks how archaeologists reach a conclusion.</p>
      <div className="method-grid">{methods.map(method => <article key={method.id}>
        <h3>{method.name}</h3><p>{method.what}</p><p className="method-example"><strong>Example:</strong> {method.example}</p>
        <button onClick={() => onOpen(method.source.docId, method.source.page)}>Open the slide <ArrowRight size={14} /></button>
      </article>)}</div>
    </section>
  </section>;
}
