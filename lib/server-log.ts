/**
 * Server-side error logging that never records credentials.
 * The HKU provider authenticates with a `subscription-key` query parameter,
 * so URLs and error messages are redacted before they reach Vercel logs.
 */
export function redact(text: string): string {
  return text
    .replace(/([?&](?:subscription-key|key|token|api[-_]?key)=)[^&\s"']+/gi, '$1[redacted]')
    .replace(/https?:\/\/[^\s"']*api\.hku\.hk[^\s"']*/gi, '[hku-endpoint]');
}

export function logServerError(scope: string, error: unknown, extra: Record<string, string | number | boolean> = {}): void {
  const kind = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? redact(error.message).slice(0, 300) : '';
  console.error(JSON.stringify({ level: 'error', scope, kind, message, ...extra, at: new Date().toISOString() }));
}
