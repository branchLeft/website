import { SITE_URL } from '../lib/meta';

/**
 * Resource route that serves a generated `sitemap.xml`, mirroring the
 * pattern in logo-svg.tsx (a route module that returns a non-HTML
 * `Response` instead of rendering a page).
 *
 * The path list below is maintained by hand rather than derived from
 * `app/routes.ts`: react-router's route config doesn't distinguish
 * indexable HTML pages from resource routes (like this one, or
 * `/logo.svg`) or carry per-route "should this be in the sitemap" intent,
 * so mechanically deriving one would need that bookkeeping added anyway.
 * Given how rarely routes are added to this site, keeping the two lists in
 * sync by hand is the simpler option — add new page paths to both.
 */
interface PageEntry {
  path: string;
  lastmod: string;
}

const PAGES: readonly PageEntry[] = [
  { path: '/', lastmod: '2026-07-28' },
  { path: '/about', lastmod: '2026-07-28' },
  { path: '/solutions/local-news', lastmod: '2026-07-28' },
  { path: '/solutions/affordable-websites', lastmod: '2026-07-28' },
  { path: '/contact', lastmod: '2026-07-28' },
  { path: '/privacy', lastmod: '2026-07-28' },
  { path: '/terms', lastmod: '2026-07-28' },
];

function buildSitemapXml(): string {
  const urlEntries = PAGES.map(
    ({ path, lastmod }) =>
      `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
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
