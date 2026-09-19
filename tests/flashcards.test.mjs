import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFlashcardScope, selectFlashcardExcerpts, validateFlashcards, flashcardSchema, flashcardTargetCount, reviewedFlashcardFallback } from '../lib/flashcard-generation.ts';
import documents from '../lib/documents.json' with { type: 'json' };
import corpus from '../lib/corpus.json' with { type: 'json' };

test('flashcard scope rejects invalid weeks, counts and cross-week documents', () => {
  for (const value of [null, [], { week: 0, count: 6 }, { week: 2, count: 100 }, { week: 3, count: 6, docId: 'd102' }, { week: 4, count: 6 }, { week: 2, count: 6, docId: 'd001' }, { week: 2, count: 6, docId: '' }]) assert.throws(() => parseFlashcardScope(value));
  assert.deepEqual(parseFlashcardScope({ week: 2, count: 6, docId: 'd102' }), { week: 2, count: 6, docId: 'd102' });
});

test('every week has bounded substantive excerpts preserving actual source pages', () => {
  for (let week = 1; week <= 3; week++) {
    const excerpts = selectFlashcardExcerpts({ week, count: 10 });
    assert.ok(excerpts.length >= 3 && excerpts.length <= 20);
    assert.ok(excerpts.filter(s => documents.find(d => d.id === s.docId).kind === 'Lecture').length >= 10);
    assert.equal(new Set(excerpts.map(s => s.citeId)).size, excerpts.length);
    for (const excerpt of excerpts) {
      const doc = documents.find(d => d.id === excerpt.docId);
      assert.equal(doc.week, week);
      assert.ok(excerpt.page >= 1 && excerpt.page <= doc.pages);
      assert.ok(excerpt.text.length <= 1800);
      assert.ok(corpus.filter(p => p.docId === excerpt.docId && p.page === excerpt.page).map(p => p.text).filter((text, index, all) => all.indexOf(text) === index).join('\n\n').startsWith(excerpt.text));
      assert.doesNotMatch(excerpt.text, /add locator map|quiz.*cover|quiz instructions|alternative table|to be added|table of contents/i);
    }
  }
});

test('document selection samples its full page range and never borrows other sources', () => {
  const excerpts = selectFlashcardExcerpts({ week: 2, count: 6, docId: 'd102' });
  assert.ok(excerpts.every(s => s.docId === 'd102'));
  assert.ok(excerpts.at(-1).page - excerpts[0].page > 40);
  const text = 'Archaeological evidence supports interpretation of settlement patterns and social organization. '.repeat(4);
  const docs = [{ id: 'lecture', week: 2, title: 'Course lecture', kind: 'Lecture', pages: 3 }, { id: 'draft', week: 2, title: 'Draft notes', kind: 'Literature', pages: 3 }];
  assert.equal(selectFlashcardExcerpts({ week: 2, count: 6 }, [{ docId: 'lecture', page: 1, text: 'Quiz instructions: ' + text }, { docId: 'lecture', page: 2, text }, { docId: 'draft', page: 1, text }], docs).length, 1);
});

const excerpt = { citeId: 'd102-p42', docId: 'd102', page: 42, title: 'Urbanization', label: 'Slide 42', text: 'Uruk had monumental buildings and specialized craft production. Archaeological evidence requires careful interpretation.' };
const valid = { question: 'What evidence of organized activity is recorded at Uruk?', answer: 'Monumental buildings and specialized craft production.', evidence: 'Uruk had monumental buildings and specialized craft production.', citeId: excerpt.citeId };

test('validation resolves citations itself and accepts whitespace-normalized exact evidence', () => {
  const cards = validateFlashcards({ cards: [{ ...valid, evidence: 'Uruk had monumental buildings\nand specialized craft production.', source: { page: 999 } }] }, [excerpt], 6);
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0].source, { docId: 'd102', page: 42, title: 'Urbanization', label: 'Slide 42' });
});

test('validation rejects hallucinated citations, unsupported quotes, duplicates, answer leaks and unseen figures', () => {
  const cards = validateFlashcards({ cards: [valid,
    { ...valid, citeId: 'invented' },
    { ...valid, question: 'What was the population of Uruk?', evidence: 'Uruk had exactly one million inhabitants.' },
    { ...valid, question: valid.question.toUpperCase() + '!' },
    { ...valid, question: 'Explain Monumental buildings and specialized craft production.' },
    { ...valid, question: 'What can you identify in this image of Uruk?' },
    { ...valid, question: 'x'.repeat(351) },
  ] }, [excerpt], 6);
  assert.equal(cards.length, 1);
  assert.deepEqual(validateFlashcards({ cards: [null, {}, 'bad'] }, [excerpt], 6), []);
  assert.deepEqual(validateFlashcards(null, [excerpt], 6), []);
});

test('schema constrains generated citation ids to the supplied excerpts', () => {
  const schema = flashcardSchema([excerpt], 6);
  assert.deepEqual(schema.properties.cards.items.properties.citeId.enum, ['d102-p42']);
  assert.equal(schema.properties.cards.maxItems, 6);
});

test('short blocks are aggregated only within the same source page and reading frontmatter is excluded',()=>{
 const docs=[{id:'test',week:1,title:'Principles',kind:'Reading',pages:5,startPage:4}];
 const passages=[{docId:'test',page:1,text:'Frontmatter '.repeat(20)},{docId:'test',page:4,text:'Archaeologists record the precise location of objects.'},{docId:'test',page:4,text:'Their relationships help to establish archaeological context.'},{docId:'test',page:5,text:'Separate short fragment.'}];
 const excerpts=selectFlashcardExcerpts({week:1,count:6},passages,docs);
 assert.equal(excerpts.length,1);assert.equal(excerpts[0].page,4);assert.ok(excerpts[0].text.includes('relationships'));assert.ok(!excerpts[0].text.includes('Separate'));
});
test('all nine active sources can be selected without borrowing material',()=>{
 assert.equal(documents.length,9);
 for(const doc of documents){const excerpts=selectFlashcardExcerpts({week:doc.week,docId:doc.id,count:6});assert.ok(excerpts.length>0,doc.id);assert.ok(excerpts.every(s=>s.docId===doc.id&&s.page>=(doc.startPage||1)));}
});

test('short summaries request only three cards and larger excerpts respect requested count', () => {
 assert.equal(flashcardTargetCount([{...excerpt,text:'Evidence '.repeat(70)}],10),3);
 assert.equal(flashcardTargetCount([{...excerpt,text:'Evidence '.repeat(250)}],10),6);
 assert.equal(flashcardTargetCount([{...excerpt,text:'Evidence '.repeat(500)}],6),6);
});
test('reviewed fallback uses only in-scope short answers with known source pages', () => {
 for (const doc of documents) {
  const cards=reviewedFlashcardFallback({week:doc.week,docId:doc.id,count:6});
  assert.ok(cards.every(card=>card.source.docId===doc.id&&card.source.page>=doc.startPage&&card.source.page<=doc.pages&&card.evidence.trim()));
 }
 const cards=reviewedFlashcardFallback({week:1,count:6});assert.ok(cards.length>0);assert.ok(cards.every(card=>documents.find(doc=>doc.id===card.source.docId).week===1));
 const base={id:'test',kind:'short-answer',question:'What is archaeology?',answer:'A scientific study.',evidence:'Verified course evidence',source:{docId:'d101',page:2,title:'Lecture',label:'Slide 2'}};
 assert.equal(reviewedFlashcardFallback({week:1,count:6},[base,{...base,id:'comparison',kind:'comparison'},{...base,id:'outside',source:{...base.source,docId:'d102'}},{...base,id:'invalid',source:{...base.source,page:999}},{...base,id:'empty',evidence:''},{...base,id:'unknown',source:{...base.source,docId:'d001'}}]).length,1);
 assert.deepEqual(reviewedFlashcardFallback({week:1,docId:'d104',count:6}),[]);
});
