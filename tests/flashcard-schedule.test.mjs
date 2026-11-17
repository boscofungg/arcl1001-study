import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleCard, dueCardIds, nextDue, parseSchedule } from '../lib/flashcard-schedule.ts';

const deck = { id: 'deck', week: 1, title: 'T', createdAt: '2026-01-01T00:00:00Z', cards: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
const now = Date.parse('2026-11-17T00:00:00Z'), day = 86400000;

test('known cards move to longer gaps; again cards are due immediately', () => {
  let schedule = scheduleCard({}, 'deck', 'a', 'known', now);
  schedule = scheduleCard(schedule, 'deck', 'b', 'again', now);
  assert.deepEqual(dueCardIds(deck, schedule, now), ['b']);
  assert.deepEqual(dueCardIds(deck, schedule, now + day), ['a', 'b']);
  schedule = scheduleCard(schedule, 'deck', 'a', 'known', now + day);
  assert.equal(schedule['deck:a'].box, 2);
  assert.equal(nextDue(deck, schedule, now + day).getTime(), now + 4 * day);
  schedule = scheduleCard(schedule, 'deck', 'a', 'again', now + day);
  assert.equal(schedule['deck:a'].box, 0);
});

test('corrupt stored schedules are ignored safely', () => {
  assert.deepEqual(parseSchedule('not json'), {});
  assert.deepEqual(parseSchedule('[]'), {});
  assert.deepEqual(parseSchedule(JSON.stringify({ x: { box: 99, due: 'nope' }, y: { box: 1, due: '2026-01-01T00:00:00Z' } })), { y: { box: 1, due: '2026-01-01T00:00:00Z' } });
});
