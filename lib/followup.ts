/**
 * Build the search query for the tutor. Short follow-ups ("why?", "what about Harappa?",
 * "explain it more simply") carry little searchable text on their own, so the previous
 * student question is added to retrieval. The model still sees the original question.
 */
type Turn = { role: string; text: string };

const referring = /\b(it|its|this|that|these|those|they|them|their|he|she|his|her|there|then|more|why|continue|same|above|previous|earlier|again|instead|else|other|another|example|examples|simpler|shorter|longer)\b/i;
const continuation = /^\s*(and|but|also|so|then|what about|how about|and what|why|how come|what else|any other|compare (it|that|them)|explain (it|that|more))\b/i;

export function isFollowup(question: string): boolean {
  const words = question.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return false;
  if (words <= 3) return true;
  if (words >= 16) return false;
  return continuation.test(question) || (words < 12 && referring.test(question));
}

export function retrievalQuery(question: string, history: readonly Turn[] = []): string {
  const previous = [...history].reverse().find(turn => turn.role === 'user')?.text?.trim();
  if (!previous || !isFollowup(question)) return question;
  return `${question} ${previous.slice(0, 600)}`;
}
