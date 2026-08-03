import { SITE_URL } from '../lib/meta';
import { PAGE_PATHS } from '../lib/page-paths';

/**
 * Resource route that serves a generated `sitemap.xml`, mirroring the
 * pattern in logo-svg.tsx (a route module that returns a non-HTML
 * `Response` instead of rendering a page).
 *
 * No `<lastmod>` per URL: a build-time timestamp would mark every page as
 * "just changed" on every deploy regardless of real content changes — a
 * false freshness signal that's arguably worse than omitting the field —
 * and a git-derived per-file date is more moving parts than this low-churn
 * static site's sitemap needs.
 */
function buildSitemapXml(): string {
  const urlEntries = PAGE_PATHS.map(
    (path) => `  <url>\n    <loc>${SITE_URL}${path}</loc>\n  </url>`
  ).join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urlEntries}\n` +
    '</urlset>\n'
  );
}

export function loader(): Response {
  return new Response(buildSitemapXml(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Short-lived rather than logo.svg's immutable/1-year cache: this
      // list changes whenever a route is added or removed, and there's no
      // content-hash in the URL to bust a longer-lived cache with.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
