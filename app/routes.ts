import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('publicpress', 'routes/publicpress.tsx'),
  route('about', 'routes/about.tsx'),
  route('bespoke', 'routes/bespoke.tsx'),
  route('contact', 'routes/contact.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('terms', 'routes/terms.tsx'),
  // The pages these addresses served were folded into /publicpress and
  // /bespoke; links already shared keep working through a permanent redirect.
  route('solutions/local-news', 'routes/moved.tsx', { id: 'moved-local-news' }),
  route('solutions/affordable-websites', 'routes/moved.tsx', { id: 'moved-affordable-websites' }),
  // Resource route: renders the Logo React component to an SVG response so
  // the site favicon and any /logo.svg reference stay in sync with the
  // published component.
  route('logo.svg', 'routes/logo-svg.tsx'),
  // Resource route: serves a generated sitemap.xml listing the indexable
  // page routes above — see the module comment in sitemap-xml.tsx.
  route('sitemap.xml', 'routes/sitemap-xml.tsx'),
  // Resource route: the theme switch posts here when JavaScript is off.
  route('theme', 'routes/theme.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
