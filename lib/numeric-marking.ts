/** Numeric tolerances are authored per question; this matcher never invents them. */
export type NumericRule = {
  kind: 'bce' | 'yearsAgo' | 'count';
  min: number;
  max: number;
  range?: { startMin: number; startMax: number; endMin: number; endMax: number };
};

type Claim = { values: number[]; index: number; end: number; wrongUnit?: boolean };
const number = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?`;
const separator = String.raw`\s*(?:[-–—]|\bto\b|\band\b)\s*`;
const era = String.raw`(?:B\.?\s*C\.?(?:\s*E\.?)?|A\.?\s*D\.?|C\.?\s*E\.?)`;
const quantityUnit = String.raw`(?:million|thousand|mya|kya|ka|k)`;
const ageUnit = String.raw`(?:years?(?:\s+(?:ago|old|B\.?P\.?))?|B\.?P\.?|mya|kya|ka)`;
const calendarScale = String.raw`(?:million|thousand|k)`;
const valueOf = (value: string) => Number(value.replaceAll(',', ''));
const multiplier = (unit = '') => /million|mya/i.test(unit) ? 1_000_000 : /thousand|kya|ka|^k$/i.test(unit.trim()) ? 1_000 : 1;
const isBce = (unit: string) => /^bc(?:e)?$/i.test(unit.replace(/[.\s]/g, ''));

function claimsFor(text: string, kind: NumericRule['kind']): Claim[] {
  const claims: Claim[] = [];
  const add = (match: RegExpExecArray, values: number[], wrongUnit = false) => {
    const prefix = text.slice(0, match.index);
    const rangeDash = new RegExp(`${era}\\s*-\\s*$`, 'i').test(prefix);
    const negative = !rangeDash && /(?:^|[\s(])[-−]\s*$/.test(prefix);
    claims.push({ values, index: match.index, end: match.index + match[0].length, wrongUnit: wrongUnit || negative });
  };
  if (kind === 'bce') {
    const centuries = new RegExp(`\\b(${number})(?:st|nd|rd|th)\\s+century\\s*(${era})(?![a-z])`, 'gi');
    let match:RegExpExecArray|null;
    while ((match = centuries.exec(text))) {
      const n = valueOf(match[1]);
      add(match, [n * 100, (n - 1) * 100 + 1], !isBce(match[2]) || n < 1 || n > 100);
    }
    const dates = new RegExp(`\\b(${number})\\s*(${calendarScale})?(?:\\s*(${era}))?(?:${separator}(${number})\\s*(${calendarScale})?)?\\s*(${era})(?![a-z])`, 'gi');
    while ((match = dates.exec(text))) {
      if (claims.some(c => match!.index >= c.index && match!.index < c.end)) continue;
      const values = match[4]
        ? [valueOf(match[1]) * multiplier(match[2] || match[5]), valueOf(match[4]) * multiplier(match[5] || match[2])]
        : [valueOf(match[1]) * multiplier(match[2])];
      add(match, values, !isBce(match[6]) || Boolean(match[3] && !isBce(match[3])));
    }
    // Era-first answers (e.g. "BCE 2600") are also unambiguous.
    const prefixed = new RegExp(`\\b(${era})\\s*(${number})\\s*(${calendarScale})?(?:${separator}(${number})\\s*(${calendarScale})?)?`, 'gi');
    while ((match = prefixed.exec(text))) {
      if (claims.some(c => match!.index < c.end && match!.index + match![0].length > c.index)) continue;
      const values = match[4]
        ? [valueOf(match[2]) * multiplier(match[3] || match[5]), valueOf(match[4]) * multiplier(match[5] || match[3])]
        : [valueOf(match[2]) * multiplier(match[3])];
      add(match, values, !isBce(match[1]));
    }
    const ages = new RegExp(`\\b${number}\\s*(?:${quantityUnit})?\\s*${ageUnit}(?![a-z])`, 'gi');
    while ((match = ages.exec(text))) add(match, [], true);
  } else if (kind === 'yearsAgo') {
    const ages = new RegExp(`\\b(${number})\\s*(${quantityUnit})?(?:${separator}(${number})\\s*(${quantityUnit})?)?\\s*(${ageUnit})?(?![a-z0-9])`, 'gi');
    let match:RegExpExecArray|null;
    while ((match = ages.exec(text))) {
      const firstUnit = match[2] || ''; const lastUnit = match[4] || ''; const ending = match[5] || '';
      // "million" alone is not an age; mya/kya/ka intrinsically are.
      if (!ending && !/^(mya|kya|ka)$/i.test(lastUnit || firstUnit)) continue;
      const shared = lastUnit || firstUnit || ending;
      const values = match[3]
        ? [valueOf(match[1]) * multiplier(firstUnit || shared), valueOf(match[3]) * multiplier(lastUnit || firstUnit || ending)]
        : [valueOf(match[1]) * multiplier(firstUnit || ending)];
      add(match, values);
    }
    // Explicit calendar years must not be mistaken for elapsed ages.
    const calendars = new RegExp(`\\b${number}\\s*(?:${calendarScale})?\\s*${era}(?![a-z])`, 'gi');
    while ((match = calendars.exec(text))) add(match, [], true);
  } else {
    const standalone = new RegExp(`^\\s*(${number})\\s*[.!]?\\s*$`).exec(text);
    if (standalone) add(standalone, [valueOf(standalone[1])]);
    else {
      const counts = new RegExp(`(?:\\bcount\\s*[:=]?\\s*(${number})|\\b(${number})\\s+(?:items|objects|sites|people|burials|graves|artefacts|artifacts|rooms|steps|levels|layers|examples)\\b)`, 'gi');
      let match:RegExpExecArray|null;
      while ((match = counts.exec(text))) add(match, [valueOf(match[1] || match[2])]);
    }
  }
  return claims;
}

function negated(text: string, claim: Claim): boolean {
  const before = text.slice(Math.max(0, claim.index - 65), claim.index).split(/[.;!?]/).at(-1) || '';
  const after = text.slice(claim.end, claim.end + 35);
  return /\b(?:not|never|neither|isn't|wasn't|incorrect|wrong|rather than)\b[^,;.!?]*$/i.test(before)
    || /^\s*(?:is|was|would be)?\s*(?:incorrect|wrong|not correct)\b/i.test(after);
}

/** All explicit date/age claims must agree with the rule: extra conflicting dates fail. */
export function matchNumericAnswer(text: string, rule: NumericRule): { matched: boolean; feedback: string } {
  const no = (feedback: string) => ({ matched: false, feedback });
  if (typeof text !== 'string' || !text.trim() || text.length > 2000) return no('Enter a short answer with a number and its date or age units.');
  const limits = [rule.min, rule.max, ...(rule.range ? Object.values(rule.range) : [])];
  if (limits.some(n => !Number.isFinite(n) || n < 0) || rule.min > rule.max || (rule.range && (rule.range.startMin > rule.range.startMax || rule.range.endMin > rule.range.endMax))) return no('This numeric answer needs a valid marking range.');
  const claims = claimsFor(text, rule.kind);
  if (!claims.length) return no(rule.kind === 'bce' ? 'Include BC or BCE with the date.' : rule.kind === 'yearsAgo' ? 'Include age units, such as years ago or million years ago.' : 'Give the count explicitly.');
  if (claims.some(c => c.wrongUnit || negated(text, c))) return no('Check the era, units and any conflicting or negated dates in your answer.');
  const inside = (n: number, low: number, high: number) => n >= low && n <= high;
  const matches = (claim: Claim) => {
    const r = rule.range;
    if (!r) return claim.values.every(n => inside(n, rule.min, rule.max));
    if (claim.values.length !== 2) return false;
    const [a, b] = claim.values;
    return (inside(a, r.startMin, r.startMax) && inside(b, r.endMin, r.endMax))
      || (inside(b, r.startMin, r.startMax) && inside(a, r.endMin, r.endMax));
  };
  // Two individually labelled endpoints form a range; unrelated dates cannot rescue a mismatch.
  const effective = rule.range && claims.length === 2 && claims.every(c => c.values.length === 1)
    ? [{ ...claims[0], values: claims.flatMap(c => c.values) }] : claims;
  if (!effective.every(matches)) return no(rule.range ? 'Check both ends of the date range and their units.' : 'That number is outside the accepted range, or another date conflicts with it.');
  return { matched: true, feedback: 'Accepted within the allowed numeric range.' };
}
