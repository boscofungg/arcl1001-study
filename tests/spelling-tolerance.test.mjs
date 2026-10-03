import test from 'node:test';
import assert from 'node:assert/strict';
import {tolerateSlideSpelling} from '../lib/spelling-tolerance.ts';
import {markSlideAnswer} from '../lib/slide-marking.ts';

test('small, unambiguous place-name typos receive credit without changing model answers',()=>{
 for(const answer of ['Harapa in Pakistam','Harappa in Pakitsan']){
  const mark=markSlideAnswer('visual-014',answer);
  assert.equal(mark.status,'correct');
  assert.ok(mark.criteria.some(c=>c.feedback?.includes('minor spelling')));
  assert.match(mark.modelAnswer,/Harappa/);
 }
 assert.equal(markSlideAnswer('visual-002','Engis 2, Belgum, 40,000 years ago').status,'correct');
});

test('technical words accept adjacent swaps or repeated letters, not arbitrary substitutions',()=>{
 assert.equal(tolerateSlideSpelling('irrgiation and irriggation').text,'irrigation and irrigation');
 assert.equal(tolerateSlideSpelling('irritation and rotation').text,'irritation and rotation');
 assert.equal(markSlideAnswer('l4-text-02','Terraces and irrgiation').status,'correct');
 assert.notEqual(markSlideAnswer('l4-text-02','Terraces and irritation').status,'correct');
});

test('negation, meaning-bearing short words, wrong sites and dates remain strict',()=>{
 const unchanged='not no never older younger lower upper 3000 AD Uruk Giza Shang Iran Iraq';
 assert.equal(tolerateSlideSpelling(unchanged).text,unchanged);
 assert.notEqual(markSlideAnswer('visual-014','Not Harapa in Pakistam').status,'correct');
 assert.notEqual(markSlideAnswer('visual-014','Mohenjo Daro in Pakistan').status,'correct');
 assert.notEqual(markSlideAnswer('visual-002','Engis 2, Belgum, 40,000 AD').status,'correct');
 assert.equal(tolerateSlideSpelling('harrappaa').text,'harrappaa');
 assert.equal(tolerateSlideSpelling('3000bce').text,'3000bce');
});
