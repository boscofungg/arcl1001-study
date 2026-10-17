import test from 'node:test';
import assert from 'node:assert/strict';
import { mapTargets, clampMapPoint } from '../lib/mock-map-data.ts';

test('map targets have unique labels and safe normalized guide points', () => {
  assert.equal(new Set(mapTargets.map((target) => target.id)).size, mapTargets.length);
  for (const target of mapTargets) {
    assert.ok(target.x > 0 && target.x < 1 && target.y > 0 && target.y < 1);
    assert.ok(target.feedback && target.source);
  }
  assert.ok(mapTargets.find((target) => target.id === 'south-america').x < mapTargets.find((target) => target.id === 'tigris').x);
  assert.ok(mapTargets.find((target) => target.id === 'tigris').x < mapTargets.find((target) => target.id === 'yellow-river').x);
});

test('map placement bounds invalid and out-of-frame coordinates', () => {
  assert.deepEqual(clampMapPoint({ x: -1, y: 3 }), { x: 0, y: 1 });
  assert.deepEqual(clampMapPoint({ x: NaN, y: Infinity }), { x: .5, y: .5 });
  assert.deepEqual(clampMapPoint({ x: .2, y: .7 }), { x: .2, y: .7 });
});
