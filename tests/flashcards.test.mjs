import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFlashcardScope, selectFlashcardExcerpts, validateFlashcards, flashcardSchema } from '../lib/flashcard-generation.ts';
import documents from '../lib/documents.json' with { type: 'json' };
import corpus from '../lib/corpus.json' with { type: 'json' };

test('flashcard scope rejects invalid weeks, counts and cross-week documents', () => {
  for (const value of [null, [], { week: 0, count: 6 }, { week: 2, count: 100 }, { week: 3, count: 6, docId: 'd001' }, { week: 2, count: 6, docId: '' }]) assert.throws(() => parseFlashcardScope(value));
  assert.deepEqual(parseFlashcardScope({ week: 2, count: 6, docId: 'd001' }), { week: 2, count: 6, docId: 'd001' });
});

test('every week has bounded substantive excerpts preserving actual source pages', () => {
  for (let week = 2; week <= 7; week++) {
    const excerpts = selectFlashcardExcerpts({ week, count: 10 });
    assert.ok(excerpts.length >= 3 && excerpts.length <= 20);
    assert.ok(excerpts.filter(s => documents.find(d => d.id === s.docId).kind === 'Lecture').length >= 10);
    assert.equal(new Set(excerpts.map(s => s.citeId)).size, excerpts.length);
    for (const excerpt of excerpts) {
      const doc = documents.find(d => d.id === excerpt.docId);
      assert.equal(doc.week, week);
      assert.ok(excerpt.page >= 1 && excerpt.page <= doc.pages);
      assert.ok(excerpt.text.length <= 1800);
      assert.ok(corpus.some(p => p.docId === excerpt.docId && p.page === excerpt.page && p.text.startsWith(excerpt.text)));
      assert.doesNotMatch(excerpt.text, /add locator map|quiz.*cover|quiz instructions|alternative table|to be added|table of contents/i);
    }
  }
});

test('document selection samples its full page range and never borrows other sources', () => {
  const excerpts = selectFlashcardExcerpts({ week: 2, count: 6, docId: 'd001' });
  assert.ok(excerpts.every(s => s.docId === 'd001'));
  assert.ok(excerpts.at(-1).page - excerpts[0].page > 70);
  const text = 'Archaeological evidence supports interpretation of settlement patterns and social organization. '.repeat(4);
  const docs = [{ id: 'lecture', week: 2, title: 'Course lecture', kind: 'Lecture', pages: 3 }, { id: 'draft', week: 2, title: 'Draft notes', kind: 'Literature', pages: 3 }];
  assert.equal(selectFlashcardExcerpts({ week: 2, count: 6 }, [{ docId: 'lecture', page: 1, text: 'Quiz instructions: ' + text }, { docId: 'lecture', page: 2, text }, { docId: 'draft', page: 1, text }], docs).length, 1);
});

const excerpt = { citeId: 'd001-p42', docId: 'd001', page: 42, title: 'Urbanization', label: 'Slide 42', text: 'Uruk had monumental buildings and specialized craft production. Archaeological evidence requires careful interpretation.' };
const valid = { question: 'What evidence of organized activity is recorded at Uruk?', answer: 'Monumental buildings and specialized craft production.', evidence: 'Uruk had monumental buildings and specialized craft production.', citeId: excerpt.citeId };

test('validation resolves citations itself and accepts whitespace-normalized exact evidence', () => {
  const cards = validateFlashcards({ cards: [{ ...valid, evidence: 'Uruk had monumental buildings\nand specialized craft production.', source: { page: 999 } }] }, [excerpt], 6);
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0].source, { docId: 'd001', page: 42, title: 'Urbanization', label: 'Slide 42' });
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
  assert.deepEqual(schema.properties.cards.items.properties.citeId.enum, ['d001-p42']);
  assert.equal(schema.properties.cards.maxItems, 6);
});
