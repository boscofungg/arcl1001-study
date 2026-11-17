import test from 'node:test';
import assert from 'node:assert/strict';
import { isFollowup, retrievalQuery } from '../lib/followup.ts';

const history = [{ role: 'user', text: 'What makes Uruk a city?' }, { role: 'assistant', text: 'Uruk had…' }];

test('short and referring questions reuse the previous question for search', () => {
  for (const question of ['Why?', 'Explain it more simply', 'What about Harappa?', 'And the dates?', 'Give another example'])
    assert.equal(retrievalQuery(question, history), `${question} What makes Uruk a city?`, question);
});

test('standalone questions and empty history are searched as written', () => {
  const standalone = 'How did the Indus cities manage water supply and drainage across the whole settlement area?';
  assert.equal(isFollowup(standalone), false);
  assert.equal(retrievalQuery(standalone, history), standalone);
  assert.equal(retrievalQuery('Why?', []), 'Why?');
  assert.equal(retrievalQuery('Who was Fu Hao and where was her tomb found?', history), 'Who was Fu Hao and where was her tomb found?');
});
