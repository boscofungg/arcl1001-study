import test from 'node:test';
import assert from 'node:assert/strict';
import { matchNumericAnswer } from '../lib/numeric-marking.ts';
const bce = { kind: 'bce', min: 2600, max: 2700 };
const age = { kind: 'yearsAgo', min: 35000, max: 45000 };
const range = { kind: 'bce', min: 1800, max: 2700, range: { startMin: 2500, startMax: 2700, endMin: 1800, endMax: 2000 } };
const yes = (s,r) => assert.equal(matchNumericAnswer(s,r).matched,true,s);
const no = (s,r) => assert.equal(matchNumericAnswer(s,r).matched,false,s);
test('BCE dates require an explicit era and respect inclusive tolerance boundaries', () => {
  for (const s of ['2600 BCE','2700 BC','2,650 B.C.E.','BCE 2650','27th century BCE']) yes(s,bce);
  for (const s of ['2600','2600 CE','2600 AD','2599 BCE','2701 BCE','26th century BCE','-2600 BCE','−2600 BCE']) no(s,bce);
});
test('range endpoints must both be close, including reversed and separately labelled endpoints', () => {
  for (const s of ['2600–1900 BCE','1900 to 2600 BC','between 2600 and 1900 BCE','2600 BCE–1900 BCE','2600 BCE to 1900 BCE','2600 BCE - 1900 BCE']) yes(s,range);
  for (const s of ['5000–100 BCE','2600 BCE','2600–900 BCE','2600 CE–1900 BCE']) no(s,range);
  no('1000–5000 BCE',bce);
});
test('age parsing handles units and ignores unrelated object IDs and discovery years', () => {
  for (const s of ['Engis 2, Belgium, 40,000 years ago; discovered 1829','40 thousand years ago','40 kya','40 ka','40k years ago','40,000 BP','35,000 years ago','45,000 years ago']) yes(s,age);
  for (const s of ['40,000 BCE','40 million years ago','40 thousand','discovered 1829','40,000','34,999 years ago','45,001 years ago']) no(s,age);
  yes('Dmanisi, 1.7 million years ago',{kind:'yearsAgo',min:1600000,max:1800000});
  yes('1.7 mya',{kind:'yearsAgo',min:1600000,max:1800000});
  yes('1.7–1.8 million years ago',{kind:'yearsAgo',min:1600000,max:1800000});
});
test('contradictions and negated answers never receive credit for containing a correct number', () => {
  for (const s of ['not 2600 BCE','2600 BCE is wrong','2600 BCE or 500 BCE','2600 BCE or 2600 CE','not around 2600 BCE','2600 BCE or 2600 years ago']) no(s,bce);
  no('not 40,000 years ago',age);
  no('40,000 years ago or 400 years ago',age);
});
test('counts require explicit counts instead of incidental numbers', () => {
  const count = {kind:'count',min:5,max:7};
  yes('6',count); yes('count: 6',count); yes('There are 6 objects.',count);
  no('Site 6 was discovered in 1829',count); no('not 6 objects',count);
});
test('invalid input and invalid tolerances fail safely', () => {
  for (const s of ['', ' ', 'x'.repeat(2001), null]) no(s,bce);
  no('2600 BCE',{...bce,min:NaN});
  no('2600 BCE',{...bce,min:3000});
});

test('common age and abbreviated calendar wording retain explicit units', () => {
  yes('Engis 2 in Belgium, 40,000 years old; discovered 1829',age);
  yes('1.7 million years',{kind:'yearsAgo',min:1600000,max:1800000});
  yes('3k BC',{kind:'bce',min:2900,max:3100});
  yes('2.5 thousand BCE',{kind:'bce',min:2400,max:2600});
  yes('2.6–1.9k BCE',range);
  yes('BC 2.6k–1.9k',range);
  no('3k CE',{kind:'bce',min:2900,max:3100});
  no('3k BC or 3k AD',{kind:'bce',min:2900,max:3100});
  no('1.7 million years or 1.7k BCE',{kind:'yearsAgo',min:1600000,max:1800000});
  no('not 40,000 years old',age);
});
