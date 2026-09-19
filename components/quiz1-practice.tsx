'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import questionBank from '@/content/quiz1-question-bank.json';
import visualBank from '@/content/quiz1-visual-questions.json';
import type { Quiz1Kind, Quiz1Question, Quiz1Review } from '@/lib/quiz1-types';
import { makeQuiz1Set, parseQuiz1Review, QUIZ1_STORAGE_KEY, quiz1KindLabels, rateQuiz1, retryQuiz1 } from '@/lib/quiz1-practice';
import './quiz1-practice.css';

const bank = [...questionBank, ...visualBank] as Quiz1Question[];
let temporary = '';
function subscribe(listener: () => void) { window.addEventListener('storage', listener); window.addEventListener('quiz1-progress', listener); return () => { window.removeEventListener('storage', listener); window.removeEventListener('quiz1-progress', listener); }; }
function snapshot() { try { return temporary || localStorage.getItem(QUIZ1_STORAGE_KEY) || ''; } catch { return temporary; } }
function save(review: Quiz1Review) { const raw = JSON.stringify(review); try { localStorage.setItem(QUIZ1_STORAGE_KEY, raw); temporary = ''; } catch { temporary = raw; } window.dispatchEvent(new Event('quiz1-progress')); }
const serverSnapshot = () => '';

export default function Quiz1Practice({ onOpen }: { onOpen: (docId: string, page: number, quote?: string) => void }) {
  const activeCard=useRef<HTMLDivElement>(null);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const review = parseQuiz1Review(raw, bank);
  const [kind, setKind] = useState<Quiz1Kind | 'mixed'>('mixed');
  const [revealed, setRevealed] = useState('');
  const [draft, setDraft] = useState({ key: '', text: '' });
  const [imageError, setImageError] = useState('');
  const question = review ? bank.find(q => q.id === review.queue[review.position]) : undefined;
  const face = review && question ? `${review.startedAt}:${review.position}:${question.id}` : '';
  const shown = Boolean(question && revealed === face);
  useEffect(()=>{activeCard.current?.scrollIntoView({behavior:'smooth',block:'start'});},[face]);
  const available = bank.filter(q => kind === 'mixed' || q.kind === kind).length;
  const missed = review ? review.queue.filter(id => review.ratings[id] === 'again').length : 0;
  function rate(rating: 'again' | 'known') { if (review && shown) { save(rateQuiz1(review, rating)); setRevealed(''); } }
  return <section className="quiz1-practice" aria-labelledby="quiz1-practice-title">
    <div className="section-kicker">RECALL / APPLY / CHECK</div>
    <h1 id="quiz1-practice-title">Quiz 1 practice</h1>
    <p className="q1-disclaimer">Quiz 1 practice — not an official paper. These sample sets have no official marks, time limit or question count.</p>
    <p className="intro">Try an answer from memory, then compare it with the course evidence.</p>
    <div className="q1-controls">
      <label>Question type<select value={kind} onChange={event => setKind(event.target.value as Quiz1Kind | 'mixed')}><option value="mixed">Mixed</option>{Object.entries(quiz1KindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="q1-primary" disabled={!available} onClick={() => { save(makeQuiz1Set(bank, kind)); setRevealed(''); }}>Start sample set</button>
      <p>{Math.min(8, available)} questions per sample set · {available} available in this category. Starting a set replaces your current practice progress.</p>
    </div>
    {!review && <div className="q1-empty"><h2>Make retrieval a habit</h2><ol><li>Identify a place and period, label a map, or explain a concept.</li><li>Write what you remember before revealing the answer.</li><li>Choose Again for anything you want to revisit.</li></ol></div>}
    {review && question && <div className="q1-session" key={face} ref={activeCard}>
      <div className="q1-position"><span>{quiz1KindLabels[question.kind]}</span><span>Question {review.position + 1} of {review.queue.length}</span></div>
      <progress value={review.position} max={review.queue.length} aria-label="Practice progress" />
      <article className="q1-card"><h2>{question.question}</h2>
        {question.image && <figure className="q1-question-image">{imageError === face ? <p role="alert">The practice image could not load. Try another set or reload before answering.</p> : /* The source title and descriptive metadata stay hidden until reveal. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={question.image.src} width={question.image.width} height={question.image.height} alt={question.kind === 'map' ? 'Practice map with locations to identify' : 'Course image for identification'} onError={() => setImageError(face)} />}</figure>}
        <label className="q1-draft">Your answer <span>(optional; not automatically marked)</span><textarea rows={3} maxLength={2000} value={draft.key === face ? draft.text : ''} onChange={event => setDraft({ key: face, text: event.target.value })} placeholder={question.kind === 'map' ? 'Write each label and its location…' : 'Recall the key points before you check…'} /></label>
        {!shown ? <button className="q1-primary" onClick={() => setRevealed(face)}>Reveal suggested answer</button> : <div className="q1-answer" aria-live="polite">
          <h3>Suggested answer</h3><p>{question.answer}</p>
          <details><summary>Check the course evidence</summary><blockquote>{question.evidence}</blockquote><button className="q1-source" onClick={() => onOpen(question.source.docId, question.source.page, question.evidence)}>{question.source.title} · {question.source.label} ↗</button>{question.additionalSources?.map((source, index) => <div key={`${source.docId}-${source.page}-${index}`}>{source.evidence && <blockquote>{source.evidence}</blockquote>}<button className="q1-source" onClick={() => onOpen(source.docId, source.page, source.evidence)}>{source.title} · {source.label} ↗</button></div>)}</details>
          <p className="q1-selfcheck">Check the meaning and evidence, not exact wording. Your choice records confidence, not a formal mark.</p>
          <div className="q1-rating"><button onClick={() => rate('again')}>Again</button><button className="q1-primary" onClick={() => rate('known')}>Got it</button></div>
        </div>}
      </article>
    </div>}
    {review && !question && <div className="q1-complete" aria-live="polite"><div className="section-kicker">SAMPLE SET COMPLETE</div><h2>Keep the uncertain ideas in view</h2><p>You marked {review.queue.length - missed} as Got it and {missed} as Again. This is a self-check, not a quiz score.</p>{missed > 0 && <><ul>{review.queue.filter(id => review.ratings[id] === 'again').map(id => <li key={id}>{bank.find(q => q.id === id)?.question}</li>)}</ul><button className="q1-primary" onClick={() => { save(retryQuiz1(review)); setRevealed(''); }}>Review {missed} again</button></>}<button className="q1-secondary" onClick={() => { save(makeQuiz1Set(bank, kind)); setRevealed(''); }}>Start another sample set</button></div>}
    <p className="q1-storage-note">Progress is saved on this browser when storage is available. Typed answers stay in this session and are never sent to AI.</p>
  </section>;
}
