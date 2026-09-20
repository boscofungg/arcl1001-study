import textQuestions from '../content/quiz1-question-bank.json' with { type: 'json' };
import visualQuestions from '../content/quiz1-visual-questions.json' with { type: 'json' };
import type { Quiz1Question } from './quiz1-types.ts';

export type GradedQuestion = Quiz1Question & {
  format: 'mcq' | 'blank';
  prompt: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  explanation: string;
};
export type GradeResult = { correct: boolean; feedback: string; matchedVariant?: string };

type QuestionUpdate = Pick<GradedQuestion, 'id' | 'format' | 'prompt' | 'answer' | 'explanation'> &
  Partial<Pick<GradedQuestion, 'options' | 'correctOptionId' | 'acceptedAnswers'>>;
const choices = (...texts: string[]) => texts.map((text, index) => ({ id: String.fromCharCode(97 + index), text }));
const updates: QuestionUpdate[] = [
  { id: 'q1-text-01', format: 'blank', prompt: 'Archaeology studies the human past through _____. Enter a short phrase.',
    answer: 'Material remains', acceptedAnswers: ['material remains', 'physical remains', 'material evidence', 'physical evidence', 'material traces', 'physical traces', 'material culture', 'archaeological remains', 'archaeological evidence', 'artifacts', 'artefacts'],
    explanation: 'Archaeology studies the human past through material remains, including landscapes, architecture and objects.' },
  { id: 'visual-003', format: 'mcq', prompt: 'Which site is shown in this image?',
    options: choices('Harappa', 'Göbekli Tepe', 'Uruk', 'Erlitou'), correctOptionId: 'b', answer: 'Göbekli Tepe',
    explanation: 'This is Göbekli Tepe in Türkiye, dated approximately 9500–8000 BCE in the lecture. Its religious interpretation is presented as a question.' },
  { id: 'q1-text-04', format: 'blank', prompt: 'In the lecture’s stratigraphy principle, deeper undisturbed layers are generally _____.',
    answer: 'Older', acceptedAnswers: ['older', 'earlier', 'more ancient', 'of greater age'],
    explanation: '“Deeper is older” describes a relative sequence of undisturbed layers, not an exact calendar date.' },
  { id: 'q1-text-05', format: 'mcq', prompt: 'What makes it possible to remove stone flakes by knapping?',
    options: choices('The colour of the surrounding soil', 'The weight of burial goods', 'The age of a written inscription', 'Predictable fracture mechanics'), correctOptionId: 'd', answer: 'Predictable fracture mechanics',
    explanation: 'Knapping uses predictable fracture mechanics to remove flakes from stone.' },
  { id: 'q1-text-15', format: 'mcq', prompt: 'Which statement correctly distinguishes knapping from refitting?',
    options: choices('Knapping produces flakes; refitting puts fragments together to study breakage.', 'Knapping dates soil layers; refitting identifies written languages.', 'Knapping joins fragments; refitting produces flakes.', 'Both methods only establish exact calendar dates.'), correctOptionId: 'a',
    answer: 'Knapping produces flakes; refitting puts fragments together to study breakage.',
    explanation: 'Refitting can reveal a sequence of breakage and possible post-deposition disturbance; knapping concerns producing flakes.' },
  { id: 'visual-017', format: 'blank', prompt: 'The site marked A is _____. Enter the site name; the marker is approximate.',
    answer: 'Uruk (Warka)', acceptedAnswers: ['Uruk', 'Warka', 'Uruk Warka', 'Warka Uruk'],
    explanation: 'Uruk, also called Warka, is in southern Mesopotamia in present-day Iraq.' },
  { id: 'visual-004', format: 'mcq', prompt: 'Which object is shown?',
    options: choices('A bevel-rim bowl', 'The Priest-King sculpture', 'The Warka Vase', 'A bronze yue axe'), correctOptionId: 'c', answer: 'The Warka Vase',
    explanation: 'The Warka Vase came from a ritual deposit in the Inanna Temple at Uruk, approximately 3000 BCE. The lecture discusses its imagery as evidence for hierarchy.' },
  { id: 'q1-text-07', format: 'blank', prompt: 'The creation of cities by a society that formerly lacked urban settlements is called _____.',
    answer: 'Urbanization', acceptedAnswers: ['urbanization', 'urbanisation', 'urbanizing', 'urbanising'],
    explanation: 'The lecture defines urbanization as the creation of cities by a society that formerly lacked urban settlements.' },
  { id: 'q1-text-08', format: 'mcq', prompt: 'Which approach best follows the lecture’s guidance for interpreting a city?',
    options: choices('Use settlement size alone to prove every social relationship.', 'Consider several attributes, such as population density, trade and monumental architecture.', 'Treat every large building as proof of a royal palace.', 'Ignore production and connections with the hinterland.'), correctOptionId: 'b',
    answer: 'Consider several attributes, such as population density, trade and monumental architecture.',
    explanation: 'The lecture lists physical, religious, political and economic attributes. Several lines of evidence should be considered together.' },
  { id: 'q1-text-09', format: 'blank', prompt: 'An object’s matrix is the surrounding _____ in which it was found.',
    answer: 'Soil or sediment', acceptedAnswers: ['soil', 'dirt', 'sediment', 'sediments', 'earth', 'soil or dirt', 'soil and dirt', 'soil or sediment', 'soil and sediment', 'surrounding soil'],
    explanation: 'Matrix refers to the surrounding soil or sediment. Provenience means where an object came from; association concerns objects found together.' },
  { id: 'visual-013', format: 'mcq', prompt: 'Which site is marked A? The marker shows an approximate location.',
    options: choices('Uruk', 'Erlitou', 'Göbekli Tepe', 'Mohenjo-daro'), correctOptionId: 'd', answer: 'Mohenjo-daro',
    explanation: 'Mohenjo-daro is in Sindh, Pakistan, in the Indus Valley.' },
  { id: 'visual-008', format: 'blank', prompt: 'This sculpture from Mohenjo-daro is conventionally called the _____. Enter its name, not a confirmed occupation.',
    answer: 'Priest-King', acceptedAnswers: ['priest king', 'priestking', 'priest king sculpture', 'priest king statue', 'the priest king'],
    explanation: 'The conventional name is “Priest-King”, approximately 1950 BCE. The name does not prove the figure was a priest or a king.' },
  { id: 'q1-text-11', format: 'mcq', prompt: 'What can we conclude from the conventional name “Priest-King”?',
    options: choices('The name alone does not establish the figure’s role or the political system.', 'It proves the figure ruled every Indus settlement.', 'It proves all Indus communities were egalitarian.', 'It confirms both the figure’s religious and royal offices.'), correctOptionId: 'a',
    answer: 'The name alone does not establish the figure’s role or the political system.',
    explanation: 'The lecture leaves egalitarian society, complex state and other possibilities open. A label is not proof of political organization.' },
  { id: 'q1-text-16', format: 'blank', prompt: 'The Harappa houses described in the lecture were built from _____. Enter the building material.',
    answer: 'Baked clay bricks', acceptedAnswers: ['baked clay bricks', 'baked clay brick', 'baked bricks', 'baked brick', 'fired clay bricks', 'fired clay brick', 'fired bricks', 'fired brick', 'kiln fired bricks', 'kiln fired clay bricks', 'burnt bricks', 'burned bricks'],
    explanation: 'Harappa houses are described as baked-clay-brick houses with courtyards and flat roofs. Erlitou includes semi-subterranean and above-ground houses; these differences alone do not establish every resident’s status.' },
  { id: 'q1-text-17', format: 'mcq', prompt: 'Which interpretation of the burial comparison is best supported?',
    options: choices('The two examples contain exactly the same types of goods.', 'Harappa’s pottery proves there was no hierarchy anywhere in the Indus region.', 'Fu Hao’s bronzes contrast with Harappa’s ornaments and pottery, but the examples do not settle hierarchy across all Indus society.', 'Fu Hao’s tomb contains no weapons or ritual vessels.'), correctOptionId: 'c',
    answer: 'Fu Hao’s bronzes contrast with Harappa’s ornaments and pottery, but the examples do not settle hierarchy across all Indus society.',
    explanation: 'Fu Hao’s tomb contains many bronze ritual vessels and weapons. Harappa is presented with ornaments, simple burial forms and pottery offerings. Avoid extending a limited comparison to every community.' },
];
const sourceBank = [...textQuestions, ...visualQuestions] as Quiz1Question[];
export const gradedQuestions: GradedQuestion[] = updates.map(update => {
  const source = sourceBank.find(question => question.id === update.id);
  if (!source) throw new Error(`Missing source question: ${update.id}`);
  // Do not inherit old multi-part answer aliases: each blank now tests one target.
  return { ...source, acceptedAnswers: undefined, ...update, question: update.prompt };
});

function normalize(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** One insertion, deletion, substitution or adjacent transposition in a long word. */
function minorTypo(actual: string, expected: string): boolean {
  if (actual === expected) return true;
  if (actual.length < 8 || expected.length < 8 || Math.abs(actual.length - expected.length) > 1) return false;
  if (actual.length === expected.length) {
    const differences = [...actual].map((char, index) => char !== expected[index] ? index : -1).filter(index => index !== -1);
    return differences.length === 1 || (differences.length === 2 && differences[1] === differences[0] + 1
      && actual[differences[0]] === expected[differences[1]] && actual[differences[1]] === expected[differences[0]]);
  }
  const [shorter, longer] = actual.length < expected.length ? [actual, expected] : [expected, actual];
  let position = 0;
  while (position < shorter.length && shorter[position] === longer[position]) position++;
  return shorter.slice(position) === longer.slice(position + 1);
}

export function gradeAnswer(question: GradedQuestion, response: string): GradeResult {
  if (typeof response !== 'string' || !response.trim()) return { correct: false, feedback: 'Enter an answer or select an option before checking.' };
  if (response.length > 160) return { correct: false, feedback: 'Use one short answer for this question.' };
  if (question.format === 'mcq') {
    const option = question.options?.find(item => item.id === response);
    if (!option) return { correct: false, feedback: 'Select one of the available options.' };
    const correct = option.id === question.correctOptionId;
    return { correct, feedback: `${correct ? 'Correct.' : `The correct answer is: ${question.answer}.`} ${question.explanation}` };
  }
  const normalized = normalize(response);
  if (!normalized || /\b(no|not|never|neither|nor|without|isnt|isn t|is not|don t|dont)\b/.test(normalized)) {
    return { correct: false, feedback: `The expected answer is ${question.answer}. ${question.explanation}` };
  }
  // Strip only neutral framing; all remaining words must match a single accepted answer.
  const framedAnswer = normalized.replace(/^(?:it is|it s|its|they are|they re|the answer is|answer is) /, '')
    .replace(/^(?:the|a|an) /, '');
  const actualWords = framedAnswer.split(' ');
  const variant = question.acceptedAnswers?.find(answer => {
    const expected = normalize(answer);
    if (framedAnswer === expected) return true;
    const words = expected.split(' ');
    // Match the whole short response, and tolerate at most one mistyped long word.
    return words.length === actualWords.length && words.filter((word, index) => word !== actualWords[index]).length === 1
      && words.every((word, index) => minorTypo(actualWords[index], word));
  });
  return variant
    ? { correct: true, feedback: `Correct — your wording is accepted. ${question.explanation}`, matchedVariant: variant }
    : { correct: false, feedback: `The expected answer is ${question.answer}. ${question.explanation}` };
}
