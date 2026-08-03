import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  route('solutions/local-news', 'routes/solutions.local-news.tsx'),
  route('solutions/affordable-websites', 'routes/solutions.affordable-websites.tsx'),
  route('contact', 'routes/contact.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('terms', 'routes/terms.tsx'),
  // Resource route: renders the Logo React component to an SVG response so
  // the site favicon and any /logo.svg reference stay in sync with the
  // published component.
  route('logo.svg', 'routes/logo-svg.tsx'),
  // Resource route: serves a generated sitemap.xml listing the indexable
  // page routes above — see the module comment in sitemap-xml.tsx.
  route('sitemap.xml', 'routes/sitemap-xml.tsx'),
] satisfies RouteConfig;
