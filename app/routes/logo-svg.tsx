import { renderToStaticMarkup } from 'react-dom/server';
import { Logo } from '@branchleft/brand-branchleft';

/**
 * Resource route that renders the Logo component to an SVG, so one component
 * drives both the favicon at /logo.svg and the on-page brand marks.
 */
export function loader(): Response {
  const body = renderToStaticMarkup(
    <Logo xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" />
  );

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
