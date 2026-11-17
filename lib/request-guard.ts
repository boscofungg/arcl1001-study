/**
 * Request guards shared by the model-backed API routes.
 *
 * Limitation: the rate-limit window lives in this serverless instance's memory,
 * so Vercel instances do not share counts. A shared store (Vercel KV / Upstash)
 * is listed as pending in docs/pending-external.md.
 */

/** Same-origin check. Browsers always send Origin on a POST fetch; scripts such as curl send neither header. */
export function sameOriginError(request: Request): string | null {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') return 'forbidden';
  if (!origin) return fetchSite === 'same-origin' ? null : 'forbidden';
  try {
    const host = request.headers.get('host') || new URL(request.url).host;
    return new URL(origin).host === host ? null : 'forbidden';
  } catch {
    return 'invalid';
  }
}

export function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export type RateWindow = Map<string, { count: number; at: number }>;

/** Fixed one-minute window per client. Returns false once `limit` requests were made in the window. */
export function allowRequest(window: RateWindow, key: string, limit: number, now = Date.now(), windowMs = 60000, maxKeys = 2000): boolean {
  for (const [client, entry] of window) if (now - entry.at >= windowMs) window.delete(client);
  const previous = window.get(key);
  if ((previous?.count || 0) >= limit) return false;
  if (!previous && window.size >= maxKeys) return false;
  window.set(key, { count: (previous?.count || 0) + 1, at: previous?.at || now });
  return true;
}
