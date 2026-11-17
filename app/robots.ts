import type { MetadataRoute } from 'next';

// Course slides and readings are licensed for HKU students; keep them out of search engines.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
