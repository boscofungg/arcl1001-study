'use client';

import { Fragment, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { ArrowDown, ArrowUp, Download, ExternalLink, ImageIcon, MessageSquare, PanelLeft, StickyNote, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';
import documentsIndex from '@/lib/documents.json';
import { mergeNotes, noteKey, notesToMarkdown, parseNotes, rawNotes, saveNotes, setNote, subscribeNotes } from '@/lib/slide-notes';
import Image from 'next/image';
import type { VisualPage } from '@/lib/media-types';
import { findSourceHighlight, findSourceHighlights, sourcePassagePreview, validSourceBox } from '@/lib/source-highlight';
import type { SourceHighlight } from '@/lib/source-highlight';
import './material-reader.css';

type DocumentInfo = { id: string; title: string; pages: number; kind: string; url?: string; isSummary?: boolean };
type PageData = { page: number; text: string; visual: (VisualPage & { representation: string }) | null };
type ReaderProps = { document: DocumentInfo; initialPage: number; onClose: () => void; onAsk: (page: number) => void; embedded?: boolean; highlight?: SourceHighlight };

function HighlightedText({ text, quote }: { text: string; quote?: string }) {
  const matches = findSourceHighlights(text, quote);
  return <>{matches.map((match, index) => <Fragment key={match.start}>{text.slice(index ? matches[index - 1].end : 0, match.start)}<mark className="mr-text-highlight">{text.slice(match.start, match.end)}</mark></Fragment>)}{text.slice(matches.length ? matches[matches.length - 1].end : 0)}</>;
}

function ReaderPage({ doc, page, zoom, root, highlight, requestedPage, onReady, onAsk, note, onNote }: {
  doc: DocumentInfo; page: number; zoom: number; root: RefObject<HTMLDivElement | null>;
  highlight?: SourceHighlight; requestedPage: number; onReady: (page: number) => void; onAsk: (page: number) => void;
  note: string; onNote: (page: number, text: string) => void;
}) {
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const section = useRef<HTMLElement>(null);
  const [nearby, setNearby] = useState(false);
  const [result, setResult] = useState<{ data?: PageData; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const label = doc.kind === 'Lecture' ? 'Slide' : 'Page';
  const selected = highlight?.page === page;
  const shouldLoad = nearby || requestedPage === page;
  const data = result?.data;

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNearby(true); observer.disconnect(); }
    }, { root: root.current, rootMargin: '400px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [root]);
  useEffect(() => {
    if (!shouldLoad) return;
    const controller = new AbortController();
    fetch(`/api/source?doc=${encodeURIComponent(doc.id)}&page=${page}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return await response.json() as PageData; })
      .then(value => setResult({ data: value }))
      .catch(() => { if (!controller.signal.aborted) setResult({ error: 'This page could not be loaded. Please try again.' }); });
    return () => controller.abort();
  }, [doc.id, page, shouldLoad, retry]);
  useEffect(() => { if (result) onReady(page); }, [result, page, onReady]);

  const images = doc.isSummary ? [] : data?.visual?.images || [];
  const suppliedBox = selected ? validSourceBox(highlight.box) : null;
  const boxes = suppliedBox ? [suppliedBox] : selected && highlight.text ? (data?.visual?.textBlocks || []).flatMap(block => {
    const box = validSourceBox(block.box);
    const matches = findSourceHighlights(block.text, highlight.text).length > 0 || (block.text.trim().length > 12 && findSourceHighlight(highlight.text || '', block.text));
    return box && matches ? [box] : [];
  }) : [];
  const showVisual = !doc.isSummary;
  const showText = doc.isSummary;
  const citedPassage = selected ? sourcePassagePreview(data?.text || '', highlight.text)
    || sourcePassagePreview(data?.visual?.text || '', highlight.text) : null;
  return <article ref={section} data-reader-page={page} className={`mr-page ${selected ? 'mr-page-selected' : ''}`} aria-label={`${label} ${page}`}>
    <header className="mr-page-heading"><h3>{doc.isSummary ? 'Source summary' : `${label} ${page}`}</h3>{selected && <span className="mr-source-label">Cited source</span>}<button disabled={!data} onClick={() => onAsk(page)}><MessageSquare size={14} /> Ask about this {label.toLowerCase()}</button></header>
    {selected && data && <aside className="mr-cited-passage" aria-label="Cited passage">
      <h4>{citedPassage ? 'Cited passage' : 'Cited page'}</h4>
      {citedPassage ? <blockquote><mark className="mr-text-highlight">{citedPassage}</mark></blockquote> : <p>An exact passage could not be matched in the extracted text. Check the original page for context.</p>}
      {citedPassage && <p>{doc.isSummary ? 'Matched in the linked-source summary.' : 'Matched in the extracted page text.'} The original page below provides the full context.</p>}
    </aside>}
    {!result ? <div className="mr-placeholder" role={shouldLoad ? 'status' : undefined}>{shouldLoad ? `Loading ${label.toLowerCase()} ${page}…` : `${label} ${page}`}</div> : result.error ? <div className="mr-page-error" role="alert"><p>{result.error}</p><button onClick={() => setRetry(value => value + 1)}>Retry this page</button></div> : <div className={`mr-page-body ${showVisual && showText ? 'mr-split' : ''}`}>
      {showVisual && <section className="mr-visuals" aria-label={`Original ${label.toLowerCase()} ${page}`}>
        {images.length ? <div className="mr-image-scroll"><div style={{ width: `${zoom * 100}%` }} className="mr-image-stack">{images.map((image, index) => <figure key={image.src}>
          {imageErrors.includes(image.src) ? <div className="mr-image-error">The preview could not load. <a href={image.src} target="_blank" rel="noreferrer">Open the original image</a>. Try opening the original image in a new tab.</div> : <div className="mr-image-frame"><Image unoptimized loading="lazy" src={image.src} alt={image.alt || `${doc.title}, ${label.toLowerCase()} ${page}`} width={image.width || 1200} height={image.height || 900} onError={() => setImageErrors(previous => [...previous, image.src])} />{index === 0 && data?.visual?.representation === 'page' && boxes.map((box, boxIndex) => <span key={boxIndex} className="mr-box-highlight" role="img" aria-label="Cited passage on the original page" style={{ left: `${box[0] * 100}%`, top: `${box[1] * 100}%`, width: `${(box[2] - box[0]) * 100}%`, height: `${(box[3] - box[1]) * 100}%` }} />)}</div>}
          <figcaption>{data?.visual?.representation === 'slide-images' ? 'Embedded image from the slide' : 'Original course page'}<a href={image.src} target="_blank" rel="noreferrer">Open image <ExternalLink size={12} /></a></figcaption>
        </figure>)}</div></div> : <div className="mr-no-visual"><ImageIcon size={22} /><p>No original image is available for this page. You can still ask the tutor about its content.</p></div>}
      </section>}
      {showText && <section className="mr-text" aria-label={`${label} ${page} text`}><h4>{doc.isSummary ? 'Summary of linked source' : 'Extracted text'}</h4>{doc.isSummary && <p className="mr-note">This is a source summary. Open the original for its full content and context.</p>}{data?.text ? <div className="mr-extracted-text"><HighlightedText text={data.text} quote={selected ? highlight.text : undefined} /></div> : <p className="mr-note">No readable text was extracted. The original page may contain diagrams, photographs, or scanned text.</p>}{selected && highlight.text && !findSourceHighlights(data?.text || '', highlight.text).length && !findSourceHighlights(data?.visual?.text || '', highlight.text).length && <p className="mr-note">The cited page is marked. An exact text match is not available in this extract.</p>}{data?.visual?.text && <details><summary>Chart and table data</summary><div className="mr-extracted-text"><HighlightedText text={data.visual.text} quote={selected ? highlight.text : undefined} /></div></details>}</section>}
    </div>}
    {result?.data && <div className="mr-note-box">{note || noteOpen ? <label>My notes · {label.toLowerCase()} {page}<textarea defaultValue={note} maxLength={5000} rows={3} placeholder="Type notes for this slide. Saved in this browser." onChange={event => { const text = event.currentTarget.value; if (noteTimer.current) clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => onNote(page, text), 400); }} onBlur={event => { if (noteTimer.current) clearTimeout(noteTimer.current); onNote(page, event.currentTarget.value); }} /></label> : <button type="button" onClick={() => setNoteOpen(true)}><StickyNote size={15} /> Add a note to this {label.toLowerCase()}</button>}</div>}
  </article>;
}

function Reader({ document: doc, initialPage, onClose, onAsk, embedded = false, highlight }: ReaderProps) {
  const totalPages = Math.max(1, doc.pages);
  const targetPage = Math.min(totalPages, Math.max(1, Math.trunc(highlight?.page || initialPage || 1)));
  const [requestedPage, setRequestedPage] = useState(targetPage);
  const [activePage, setActivePage] = useState(targetPage);
  const [zoom, setZoom] = useState(1);
  const [pageDraft, setPageDraft] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const jumpPending = useRef<number | null>(targetPage);
  const titleId = useId();
  const pageInputId = useId();
  const label = doc.kind === 'Lecture' ? 'Slide' : 'Page';
  const originalUrl = doc.url && /^https?:\/\//i.test(doc.url) ? doc.url : null;
  const notes = parseNotes(useSyncExternalStore(subscribeNotes, rawNotes, () => ''));
  const docNotes = Object.keys(notes).filter(key => key.startsWith(`${doc.id}:`)).length;
  const [rail, setRail] = useState(true);
  const railRef = useRef<HTMLElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [noteStatus, setNoteStatus] = useState('');
  const hasRail = !doc.isSummary && totalPages > 1;
  const saveNote = useCallback((page: number, text: string) => { const current = parseNotes(rawNotes()); if ((current[noteKey(doc.id, page)]?.text || '') === text) return; if (!saveNotes(setNote(current, doc.id, page, text))) setNoteStatus('Notes could not be saved: browser storage is unavailable.'); }, [doc.id]);
  function exportNotes(kind: 'md' | 'json') {
    const all = parseNotes(rawNotes());
    const text = kind === 'md' ? notesToMarkdown(all, Object.fromEntries(documentsIndex.map(item => [item.id, { title: item.title, kind: item.kind }]))) : JSON.stringify(all, null, 2);
    const url = URL.createObjectURL(new Blob([text], { type: kind === 'md' ? 'text/markdown' : 'application/json' }));
    const link = window.document.createElement('a'); link.href = url; link.download = kind === 'md' ? 'arcl1001-slide-notes.md' : 'arcl1001-slide-notes-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importNotes(file?: File) {
    if (!file) return;
    const imported = parseNotes(await file.text());
    const count = Object.keys(imported).length;
    if (!count) { setNoteStatus('No notes were found in that file. Choose a Stratum notes backup (.json).'); return; }
    saveNotes(mergeNotes(parseNotes(rawNotes()), imported));
    setNoteStatus(`Imported ${count} note${count === 1 ? '' : 's'}. Reopen a document to see them.`);
  }

  useEffect(() => {
    if (embedded) return;
    const element = dialog.current;
    const focused = document.activeElement as HTMLElement | null;
    if (element && !element.open) element.showModal();
    return () => { element?.close(); focused?.focus(); };
  }, [embedded]);
  const scrollToPage = useCallback((page: number) => {
    const root = scroller.current;
    const element = root?.querySelector<HTMLElement>(`[data-reader-page="${page}"]`);
    if (root && element) root.scrollTo({ top: element.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 12, behavior: 'instant' });
  }, []);
  useEffect(() => {
    jumpPending.current = targetPage;
    const frame = requestAnimationFrame(() => { setRequestedPage(targetPage); setActivePage(targetPage); scrollToPage(targetPage); });
    return () => cancelAnimationFrame(frame);
  }, [targetPage, highlight?.text, highlight?.requestId, scrollToPage]);
  const pageReady = useCallback(() => {
    if (jumpPending.current === null) return;
    requestAnimationFrame(() => { if (jumpPending.current !== null) scrollToPage(jumpPending.current); });
  }, [scrollToPage]);
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    let frame = 0;
    const updateVisiblePage = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (jumpPending.current !== null) return;
        const top = root.getBoundingClientRect().top + 24;
        const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-reader-page]'));
        const visible = pages.find(element => element.getBoundingClientRect().bottom > top);
        if (visible) setActivePage(Number(visible.dataset.readerPage));
      });
    };
    const releaseJump = () => { jumpPending.current = null; updateVisiblePage(); };
    const releaseKeyboardJump = (event: KeyboardEvent) => {
      if (event.target === root && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) releaseJump();
    };
    const resize = new ResizeObserver(() => {
      if (jumpPending.current !== null) scrollToPage(jumpPending.current);
      else updateVisiblePage();
    });
    root.querySelectorAll('[data-reader-page]').forEach(element => resize.observe(element));
    root.addEventListener('scroll', updateVisiblePage, { passive: true });
    root.addEventListener('wheel', releaseJump, { passive: true });
    root.addEventListener('touchstart', releaseJump, { passive: true });
    root.addEventListener('pointerdown', releaseJump);
    root.addEventListener('keydown', releaseKeyboardJump);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      root.removeEventListener('scroll', updateVisiblePage);
      root.removeEventListener('wheel', releaseJump);
      root.removeEventListener('touchstart', releaseJump);
      root.removeEventListener('pointerdown', releaseJump);
      root.removeEventListener('keydown', releaseKeyboardJump);
    };
  }, [scrollToPage]);
  useEffect(() => { railRef.current?.querySelector<HTMLElement>(`[data-thumb="${activePage}"]`)?.scrollIntoView({ block: 'nearest' }); }, [activePage]);
  function jump(page: number) {
    if (!Number.isInteger(page) || page < 1 || page > totalPages) return;
    jumpPending.current = page;
    setRequestedPage(page);
    setActivePage(page);
    scrollToPage(page);
  }
  const content = <div className={`mr-reader ${embedded ? 'mr-embedded' : ''}`}>
    <header className="mr-header"><div><span className="mr-kicker">{doc.isSummary ? 'LINKED COURSE SOURCE' : 'COURSE MATERIAL'}</span><h2 id={titleId}>{doc.title}</h2></div>{originalUrl && <a href={originalUrl} target="_blank" rel="noreferrer">Open original <ExternalLink size={14} /></a>}{!embedded && <button autoFocus aria-label="Close material" onClick={onClose}><X size={21} /></button>}</header>
    <div className="mr-controls">
      <div className="mr-page-navigation" role="group" aria-label={`${label} navigation`}>
        <button type="button" aria-label={`Previous ${label.toLowerCase()}`} disabled={activePage <= 1} onClick={() => jump(activePage - 1)}><ArrowUp size={22} /><span>Previous</span></button>
        <label htmlFor={pageInputId}>{label}</label><input id={pageInputId} type="text" inputMode="numeric" pattern="[0-9]*" value={pageDraft ?? String(activePage)} onBlur={() => setPageDraft(null)} aria-label={`Jump to ${label.toLowerCase()}`} onChange={event => { const value = event.currentTarget.value.trim(); setPageDraft(value); if (/^\d+$/.test(value)) jump(Number(value)); }} onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setPageDraft(null); jump(activePage + (event.key === 'ArrowDown' ? 1 : -1)); } }} /><span>of {totalPages}</span>
        <button type="button" aria-label={`Next ${label.toLowerCase()}`} disabled={activePage >= totalPages} onClick={() => jump(activePage + 1)}><span>Next</span><ArrowDown size={22} /></button>
      </div>
      {hasRail && <button type="button" className="mr-rail-toggle" aria-pressed={rail} onClick={() => setRail(value => !value)}><PanelLeft size={18} /><span>Slides</span></button>}
      <div className="mr-notes-tools" role="group" aria-label="My notes"><span><StickyNote size={15} /> Notes {docNotes ? `(${docNotes})` : ''}</span><button type="button" onClick={() => exportNotes('md')} title="Download all your notes as Markdown"><Download size={15} /><span>Export</span></button><button type="button" onClick={() => exportNotes('json')} title="Download a backup you can import on another device"><Download size={15} /><span>Backup</span></button><button type="button" onClick={() => importRef.current?.click()} title="Import a notes backup"><Upload size={15} /><span>Import</span></button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={event => { void importNotes(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} /></div>
      {!doc.isSummary && <div className="mr-zoom"><button aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .25))}><ZoomOut size={20} /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" disabled={zoom >= 2.5} onClick={() => setZoom(value => Math.min(2.5, value + .25))}><ZoomIn size={20} /></button></div>}
    </div>
    {noteStatus && <p className="mr-note-status" role="status">{noteStatus}</p>}
    <div className="mr-body">{hasRail && rail && <nav className="mr-rail" ref={railRef} aria-label={`${label} thumbnails`}>{Array.from({ length: totalPages }, (_, index) => <button type="button" key={index + 1} data-thumb={index + 1} aria-current={activePage === index + 1 ? 'true' : undefined} aria-label={`Go to ${label.toLowerCase()} ${index + 1}`} onClick={() => jump(index + 1)}>{/* eslint-disable-next-line @next/next/no-img-element */}
<img loading="lazy" src={`/materials/${doc.id}/page-${index + 1}.webp`} alt="" width={140} height={doc.kind === 'Lecture' ? 79 : 180} /><span>{index + 1}{notes[noteKey(doc.id, index + 1)] ? ' •' : ''}</span></button>)}</nav>}
    <div className="mr-scroll" ref={scroller} tabIndex={0} aria-label="Course pages, scroll to read"><p className="mr-scroll-hint">Scroll through the original pages, or use the arrows to move one page at a time.</p>{Array.from({ length: totalPages }, (_, index) => <ReaderPage key={index + 1} doc={doc} page={index + 1} zoom={zoom} root={scroller} highlight={highlight} requestedPage={requestedPage} onReady={pageReady} onAsk={onAsk} note={notes[noteKey(doc.id, index + 1)]?.text || ''} onNote={saveNote} />)}</div></div>
  </div>;
  return embedded ? content : <dialog className="mr-dialog" ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{content}</dialog>;
}

export default function MaterialReader(props: ReaderProps) { return <Reader key={props.document.id} {...props} />; }
