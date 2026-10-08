'use client';

import { Fragment, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, ImageIcon, MessageSquare, X, ZoomIn, ZoomOut } from 'lucide-react';
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

function ReaderPage({ doc, page, zoom, root, highlight, requestedPage, onReady, onAsk }: {
  doc: DocumentInfo; page: number; zoom: number; root: RefObject<HTMLDivElement | null>;
  highlight?: SourceHighlight; requestedPage: number; onReady: (page: number) => void; onAsk: (page: number) => void;
}) {
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
      {!doc.isSummary && <div className="mr-zoom"><button aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .25))}><ZoomOut size={20} /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" disabled={zoom >= 2.5} onClick={() => setZoom(value => Math.min(2.5, value + .25))}><ZoomIn size={20} /></button></div>}
    </div>
    <div className="mr-scroll" ref={scroller} tabIndex={0} aria-label="Course pages, scroll to read"><p className="mr-scroll-hint">Scroll through the original pages, or use the arrows to move one page at a time.</p>{Array.from({ length: totalPages }, (_, index) => <ReaderPage key={index + 1} doc={doc} page={index + 1} zoom={zoom} root={scroller} highlight={highlight} requestedPage={requestedPage} onReady={pageReady} onAsk={onAsk} />)}</div>
  </div>;
  return embedded ? content : <dialog className="mr-dialog" ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{content}</dialog>;
}

export default function MaterialReader(props: ReaderProps) { return <Reader key={props.document.id} {...props} />; }
