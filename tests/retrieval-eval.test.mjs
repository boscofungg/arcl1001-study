// Retrieval evaluation: does the tutor's search put supporting evidence in the top 7 sources?
// Add a case whenever a student reports a missed topic. Keep the bar at or above the current score.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tutorSources } from '../lib/tutor-sources.ts';

const cases = JSON.parse(readFileSync(new URL('./eval/retrieval-cases.json', import.meta.url), 'utf8'));
const minimumRecall = 0.9;

function evaluate(item) {
  const sources = tutorSources(item.question, 0);
  const found = item.expect.map(term => sources.some(source => item.weeks.includes(source.week) && new RegExp(term, 'i').test(source.text)));
  return { question: item.question, pass: found.every(Boolean), missing: item.expect.filter((_, i) => !found[i]) };
}

test(`retrieval finds supporting evidence for at least ${minimumRecall * 100}% of evaluation questions`, () => {
  const results = cases.map(evaluate);
  const recall = results.filter(result => result.pass).length / results.length;
  const failures = results.filter(result => !result.pass).map(result => `${result.question} (missing ${result.missing.join(', ')})`);
  assert.ok(recall >= minimumRecall, `recall ${recall.toFixed(2)} below ${minimumRecall}; misses: ${failures.join('; ')}`);
});

test('every evaluation case is well formed', () => {
  for (const item of cases) {
    assert.equal(typeof item.question, 'string');
    assert.ok(item.expect.length > 0);
    assert.ok(item.weeks.every(Number.isInteger));
  }
});
