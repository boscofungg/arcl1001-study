export type SourceHighlight = { page: number; text?: string; box?: number[] | null; requestId?: number };
export type SourceBox = [number, number, number, number];

/** Normalized PDF coordinates: [left, top, right, bottom], never inferred. */
export function validSourceBox(box: number[] | null | undefined): SourceBox | null {
  if (!box || box.length !== 4 || box.some(value => !Number.isFinite(value) || value < 0 || value > 1)) return null;
  if (box[2] <= box[0] || box[3] <= box[1]) return null;
  return [box[0], box[1], box[2], box[3]];
}

function normalizedText(text: string) {
  let normalized = '';
  const starts: number[] = [], ends: number[] = [];
  let offset = 0;
  for (const character of text) {
    const end = offset + character.length;
    for (const value of character.normalize('NFKC').toLowerCase()) {
      const next = /\s/u.test(value) ? ' ' : value;
      if (next === ' ' && normalized.endsWith(' ')) {
        ends[ends.length - 1] = end;
      } else {
        normalized += next;
        for (let index = 0; index < next.length; index++) { starts.push(offset); ends.push(end); }
      }
    }
    offset = end;
  }
  return { normalized, starts, ends };
}

/** Exact passage match after case, Unicode ligature and whitespace normalization. */
export function findSourceHighlight(text: string, quote?: string): { start: number; end: number } | null {
  if (!quote?.trim()) return null;
  const haystack = normalizedText(text);
  const needle = normalizedText(quote).normalized.trim();
  const index = haystack.normalized.indexOf(needle);
  return index < 0 ? null : { start: haystack.starts[index], end: haystack.ends[index + needle.length - 1] };
}

/** Caption evidence may join separate verbatim phrases with semicolons or newlines. */
export function findSourceHighlights(text: string, quote?: string): { start: number; end: number }[] {
  const whole = findSourceHighlight(text, quote);
  if (whole) return [whole];
  if (!quote) return [];
  const ranges = quote.split(/[;\n\r]+/u)
    .map(phrase => phrase.trim())
    .filter(phrase => normalizedText(phrase).normalized.length >= 8)
    .flatMap(phrase => {
      const match = findSourceHighlight(text, phrase);
      return match ? [match] : [];
    }).sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: { start: number; end: number }[] = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/** Preview only verbatim matched evidence; never present an unmatched citation as a quotation. */
export function sourcePassagePreview(text: string, quote?: string, limit = 600): string | null {
  const matches = findSourceHighlights(text, quote);
  if (!matches.length) return null;
  const passage = matches.map(match => text.slice(match.start, match.end).trim()).join(' … ');
  if (passage.length <= limit) return passage;
  const prefix = passage.slice(0, limit);
  const boundary = prefix.lastIndexOf(' ');
  return `${prefix.slice(0, boundary > limit / 2 ? boundary : limit).trimEnd()}…`;
}
