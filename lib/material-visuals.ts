import manifest from './visuals.json' with { type: 'json' };
import type { VisualDocument, VisualPage } from './media-types.ts';
const visuals = manifest as unknown as Record<string, VisualDocument>;
export function getPageVisual(docId: string, page: number): (VisualPage & {representation: VisualDocument['representation']}) | null {
  const doc = visuals[docId];
  const visual = doc?.pages.find(p => p.page === page);
  return visual ? {...visual, representation: doc.representation} : null;
}
