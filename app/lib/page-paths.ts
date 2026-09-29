/**
 * Every indexable HTML page path: the single source of truth for
 * sitemap-xml.tsx. Resource routes (`/logo.svg`, `/sitemap.xml`, `/theme`,
 * favicons, manifest) and the catch-all 404 are not pages, so they are left
 * out. `app/routes.ts` is not derived from this list; `page-paths.test.ts`
 * cross-checks the two, so drift fails CI.
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
