'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { dueMistakes, mistakesToCsv, mistakesToMarkdown, openMistakes, parseMistakeBook, rawMistakes, recordRetry, removeMistake, saveMistakeBook, subscribeMistakes, type Mistake } from '@/lib/mistakes';
import { markSlideAnswer } from '@/lib/slide-marking';
import Quiz1Practice from './quiz1-practice';
import './mistakes-hub.css';

type Filter = 'due' | 'open' | 'mock' | 'practice' | 'resolved';
type Props = {
  week: number;
  allowedLectures: number[];
  onLectureChange: (week: number) => void;
  onOpen: (docId: string, page: number, quote?: string) => void;
  initialFilter?: Filter;
};

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MistakesHub({ week, allowedLectures, onLectureChange, onOpen, initialFilter = 'due' }: Props) {
  const book = parseMistakeBook(useSyncExternalStore(subscribeMistakes, rawMistakes, () => ''));
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [checked, setChecked] = useState<null | { auto?: 'correct' | 'partial' | 'needs-review' }>(null);
  const due = dueMistakes(book);
  const open = openMistakes(book);
  const lists: Record<Filter, Mistake[]> = {
    due, open,
    mock: open.filter(item => item.origin === 'mock'),
    practice: open.filter(item => item.origin === 'practice'),
    resolved: book.items.filter(item => item.resolvedAt),
  };
  const shown = lists[filter];
  const active = book.items.find(item => item.id === activeId) ?? null;

  function begin(item: Mistake) { setActiveId(item.id); setDraft(''); setChecked(null); }
  function check() {
    if (!active) return;
    const mark = active.origin === 'practice' && draft.trim() ? markSlideAnswer(active.questionId, draft) : null;
    setChecked(mark ? { auto: mark.status } : {});
    if (mark) saveMistakeBook(recordRetry(book, active.id, mark.status === 'correct', draft));
  }
  function rate(correct: boolean) { if (active) saveMistakeBook(recordRetry(book, active.id, correct, draft)); next(); }
  function next() {
    const queue = shown.filter(item => item.id !== activeId);
    if (queue.length) begin(queue[0]); else { setActiveId(null); setChecked(null); }
  }

  return <section className="mistakes-hub" aria-labelledby="mistakes-title">
    <header>
      <span className="section-kicker">LEARN FROM MISTAKES</span>
      <h1 id="mistakes-title">Mistakes &amp; review</h1>
      <p>Wrong or revealed answers from mock papers and lecture practice collect here. Re-answer them until you get them right three times, spaced 1, 3 and 7 days apart.</p>
    </header>
    <div className="mistakes-summary" role="status">
      <div><strong>{due.length}</strong><span>due now</span></div>
      <div><strong>{open.length}</strong><span>still to master</span></div>
      <div><strong>{lists.resolved.length}</strong><span>mastered</span></div>
    </div>
    <div className="mistakes-toolbar">
      <div className="segmented" role="group" aria-label="Show mistakes">
        {([['due', 'Due now'], ['open', 'All open'], ['mock', 'Mock papers'], ['practice', 'Lecture practice'], ['resolved', 'Mastered']] as [Filter, string][]).map(([value, label]) =>
          <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setActiveId(null); }}>{label} <span>{lists[value].length}</span></button>)}
      </div>
      <div className="mistakes-actions">
        <button className="primary" disabled={!shown.length || filter === 'resolved'} onClick={() => begin(shown[0])}><RotateCcw size={16} /> Re-answer {filter === 'due' ? 'due' : 'these'} ({filter === 'resolved' ? 0 : shown.length})</button>
        <button disabled={!book.items.length} onClick={() => download('arcl1001-mistakes.md', mistakesToMarkdown(book), 'text/markdown')}><Download size={16} /> Export notes (.md)</button>
        <button disabled={!book.items.length} onClick={() => download('arcl1001-mistakes.csv', mistakesToCsv(book), 'text/csv')}><Download size={16} /> Export table (.csv)</button>
      </div>
    </div>

    {active && <article className="mistake-card" aria-label="Re-answer a mistake">
      <p className="mistake-meta">L{active.week || '–'} · {active.origin === 'mock' ? `Mock paper ${active.paperId ?? ''}` : 'Lecture practice'} · attempt {active.attempts + 1}</p>
      <h2>{active.prompt}</h2>
      {!!active.images?.length && <div className={`mistake-images count-${Math.min(active.images.length, 3)}`}>{active.images.map(image => <Image key={image.src} unoptimized src={image.src} width={image.width} height={image.height} alt={image.alt} />)}</div>}
      <label>Your new answer<textarea rows={4} maxLength={2000} value={draft} disabled={!!checked} onChange={event => setDraft(event.target.value)} /></label>
      {!checked ? <div className="mistake-buttons"><button className="primary" onClick={check}>Check answer</button><button onClick={next}>Skip</button></div> : <div className="mistake-feedback">
        {checked.auto && <p className={`mistake-verdict ${checked.auto}`}>{checked.auto === 'correct' ? 'Correct — recorded.' : checked.auto === 'partial' ? 'Partly right — keep it in review.' : 'Not yet — keep it in review.'}</p>}
        <h3>Model answer</h3><p>{active.modelAnswer}</p>
        {!!active.checklist?.length && <><h4>Check your answer for</h4><ul>{active.checklist.map(point => <li key={point}>{point}</li>)}</ul></>}
        <p className="mistake-previous">Earlier answer: {active.yourAnswer || '(revealed without answering)'}</p>
        <div className="mistake-sources">{active.sources.map((source, index) => <button key={index} onClick={() => onOpen(source.docId, source.page, source.evidence)}>{source.title.replace(/^Lecture (\d+) — /, 'L$1 · ')} · {source.label}</button>)}</div>
        <div className="mistake-buttons">{checked.auto ? <button className="primary" onClick={next}>Next</button> : <><button className="primary" onClick={() => rate(true)}>I got it right</button><button onClick={() => rate(false)}>Still wrong</button></>}</div>
      </div>}
    </article>}

    {!active && <ul className="mistake-list">
      {shown.map(item => <li key={item.id}>
        <div><strong>{item.prompt}</strong><small>L{item.week || '–'} · {item.origin === 'mock' ? `Mock paper ${item.paperId ?? ''}` : 'Lecture practice'} · {item.resolvedAt ? 'mastered' : due.some(entry => entry.id === item.id) ? 'due now' : `next ${new Date(item.dueAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`} · {item.box}/3 correct retries</small></div>
        <div>{!item.resolvedAt && <button onClick={() => begin(item)}>Re-answer</button>}<button aria-label="Remove from mistakes" onClick={() => saveMistakeBook(removeMistake(book, item.id))}><Trash2 size={15} /></button></div>
      </li>)}
      {!shown.length && <li className="mistake-empty">{filter === 'due' && open.length ? 'Nothing is due right now. Come back later, or choose “All open”.' : 'No mistakes here yet. Submit a mock paper or answer lecture practice questions; anything wrong or revealed will appear here.'}</li>}
    </ul>}
    <p className="mistake-note">Saved in this browser only. Export to keep a copy or move to another device. Flashcards can also be made from your mistakes in the Flashcards tab.</p>

    <div className="mistakes-practice">
      <Quiz1Practice key={week} lecture={week} allowedLectures={allowedLectures} onLectureChange={onLectureChange} onOpen={onOpen} />
    </div>
  </section>;
}
