import { renderToStaticMarkup } from 'react-dom/server';
import { Logo } from '@branchleft/components';

/**
 * Resource route that renders the `Logo` React component to an SVG file so
 * the same component that drives on-page brand marks also serves as the
 * favicon at `/logo.svg`. Eliminates the need to hand-maintain a static
 * `public/logo.svg` in lockstep with the component.
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
