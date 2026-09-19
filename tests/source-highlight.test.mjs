import assert from 'node:assert/strict';
import test from 'node:test';
import { findSourceHighlight, findSourceHighlights, validSourceBox } from '../lib/source-highlight.ts';

test('matches a passage across PDF line breaks and preserves original offsets', () => {
  const text = 'Before. Ancient\n  cities\tdeveloped here. After.';
  const range = findSourceHighlight(text, 'ancient cities developed here.');
  assert.equal(text.slice(range.start, range.end), 'Ancient\n  cities\tdeveloped here.');
});
test('handles Unicode ligatures and non-BMP characters without shifting offsets', () => {
  const text = '🏺 A ﬁeld survey near 古代 cities.';
  const range = findSourceHighlight(text, 'field survey');
  assert.equal(text.slice(range.start, range.end), 'ﬁeld survey');
});
test('never manufactures a fuzzy match for absent source text', () => {
  assert.equal(findSourceHighlight('Ancient cities', 'modern cities'), null);
  assert.equal(findSourceHighlight('Ancient cities', '  '), null);
});
test('only accepts finite, ordered normalized boxes', () => {
  assert.deepEqual(validSourceBox([0, .2, 1, .8]), [0, .2, 1, .8]);
  for (const box of [null, [], [0, 0, 1], [-.1, 0, 1, 1], [0, 0, 2, 1], [0, 0, NaN, 1], [0, 1, 1, 0], [0, 0, 0, 1]]) assert.equal(validSourceBox(box), null);
});
test('highlights separate exact date and place captions with nonoverlapping ranges', () => {
  const text = '🏺 Ancient\n  Mesopotamia\nMap legend\n3500 BCE\nNorthern cities';
  const quote = 'Ancient Mesopotamia; 3500 BCE\nNorthern cities; Ancient Mesopotamia; Mesopotamia';
  const ranges = findSourceHighlights(text, quote);
  assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), ['Ancient\n  Mesopotamia', '3500 BCE', 'Northern cities']);
  assert.ok(ranges.every((range, index) => !index || ranges[index - 1].end <= range.start));
});
test('caption fallback ignores short fragments and never guesses nonmatching phrases', () => {
  assert.deepEqual(findSourceHighlights('Uruk, 3500 BCE, river delta', 'Uruk; 3000 BCE; river valley'), []);
  const text = '3500 BCE and river delta';
  const ranges = findSourceHighlights(text, '3500 BCE and river delta');
  assert.deepEqual(ranges, [{ start: 0, end: text.length }]);
});
