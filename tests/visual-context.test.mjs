import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { buildVisualContext } from '../lib/visual-context.ts';

test('Vercel model context uses exact locally bundled original bytes without HTTP fetch', async () => {
  const files = await readdir(new URL('../public/materials/d101/', import.meta.url));
  const filename = files.find(file => file.endsWith('.webp'));
  assert.ok(filename);
  const bytes = await readFile(new URL(`../public/materials/d101/${filename}`, import.meta.url));
  const previousVercel = process.env.VERCEL;
  const originalFetch = globalThis.fetch;
  process.env.VERCEL = '1';
  globalThis.fetch = () => { throw new Error('Original visuals must not use HTTP'); };
  try {
    const result = await buildVisualContext([{title:'Lecture 1',label:'Slide 1',images:[{src:`/materials/d101/${filename}`,alt:'Original slide'}]}]);
    assert.equal(result.visualsUsed, 1);
    assert.equal(result.failedVisuals, 0);
    assert.deepEqual(result.reviewedSources, [1]);
    assert.equal(result.parts[1].inlineData.mimeType, 'image/webp');
    assert.deepEqual(Buffer.from(result.parts[1].inlineData.data,'base64'),bytes);
    const invalid = await buildVisualContext([{images:[{src:'/materials/d101/../../.env',alt:'invalid'}]}]);
    assert.equal(invalid.visualsUsed, 0);
    assert.equal(invalid.failedVisuals, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if(previousVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = previousVercel;
  }
});
