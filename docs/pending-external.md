# Pending work that needs new accounts, keys or decisions

These improvements were identified in the November 2026 review but need something that cannot
be done in code alone. Each lists what is needed and where the code would change.

| Item | Needs | Code to change |
| --- | --- | --- |
| Make the GitHub repo private | Owner: GitHub → Settings → Danger zone → Change visibility. Vercel keeps deploying. | — |
| Login or access gate for materials | HKU SSO (or another identity provider) details and a decision on who may access | Middleware for `/materials/*` and `/api/*` |
| Shared rate limits and quota tracking | Vercel KV / Upstash Redis store (env vars) | `lib/request-guard.ts` (`allowRequest`) |
| Caching common tutor answers | Same shared store | `app/api/chat/route.ts` |
| Load test before quizzes | Agreement from HKU on test traffic against the tutor quota | Test script only |
| Cross-device progress sync | Sign-in plus a database (e.g. Vercel Postgres / Supabase) | `components/*` localStorage keys |
| Usage analytics | Decision on what to collect from students; e.g. Vercel Web Analytics | `app/(study)/layout.tsx` |
| Embedding-based search | An embeddings API and key (HKU Claude has no embeddings endpoint) | `lib/retrieval.ts`; measure with `tests/retrieval-eval.test.mjs` |
| Move page images to Blob/CDN | Vercel Blob token | `public/materials`, `lib/visual-context.ts`, `next.config.ts` |
| Error monitoring service | Sentry (or similar) DSN | `lib/server-log.ts` |
| Practice questions for Lectures 6–9 | Authoring and checking against the slides | `content/`, `lib/slide-practice.ts` |
