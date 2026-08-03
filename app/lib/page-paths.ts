/**
 * Every indexable HTML page path — the single source of truth for
 * sitemap-xml.tsx's `<urlset>`. Resource routes (`/logo.svg`,
 * `/sitemap.xml`, favicons, manifest) are deliberately excluded: they're
 * not pages, so they don't belong in a sitemap.
 *
 * `app/routes.ts` isn't derived from this list (or vice versa) — it also
 * needs each route's module file and has to special-case the index route,
 * so a mechanical derivation would need its own bookkeeping anyway. Instead
 * `page-paths.test.ts` cross-checks the two lists so drift fails CI rather
 * than depending on this comment being kept in sync by hand.
 */
export const PAGE_PATHS: readonly string[] = [
  '/',
  '/about',
  '/solutions/local-news',
  '/solutions/affordable-websites',
  '/contact',
  '/privacy',
  '/terms',
];
