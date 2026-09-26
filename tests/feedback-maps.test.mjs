import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const maps = [
  { file: 'q-015.svg', longitude: 112.69, latitude: 34.6925 },
  { file: 'q-016.svg', longitude: 114.31861111111111, latitude: 36.1225 },
].map((map) => ({ ...map, svg: readFileSync(new URL(`../public/quiz1/${map.file}`, import.meta.url), 'utf8') }));

test('nearby sites use the same detailed regional frame with preserved coordinates', () => {
  const points = maps.map(({ svg, longitude, latitude }) => {
    const match = svg.match(/data-role="target" cx="([\d.]+)" cy="([\d.]+)"/);
    assert.ok(match);
    const [x, y] = match.slice(1).map(Number);
    assert.ok(Math.abs(x - (66 + (longitude - 110.5) / 6 * 648)) < 0.01);
    assert.ok(Math.abs(y - (100 + (37 - latitude) / 4 * 528)) < 0.01);
    return [x, y];
  });
  assert.ok(Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1]) > 250,
    'the two locations must be clearly separated at the shared map scale');
});

test('regional maps supply river, border, grid, locator and scale context', () => {
  for (const { svg } of maps) {
    for (const label of ['Yellow River', 'Province border', 'Region within China', '100 km', '111°E', '37°N']) {
      assert.ok(svg.includes(label), `Missing geographical context: ${label}`);
    }
    assert.match(svg, /data-layer="yellow-river"/);
    assert.match(svg, /modern, not ancient boundaries/);
    assert.match(svg, /Natural Earth/);
    assert.match(svg, /role="img" aria-labelledby="title desc"/);
    assert.doesNotMatch(svg, /Erlitou|Yinxu|Anyang|Luoyang|二里头|殷墟/i,
      'question images and accessible metadata must not disclose the site answer');
  }
});
