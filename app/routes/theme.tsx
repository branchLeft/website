import { redirect } from 'react-router';
import { THEME_COOKIE_NAME, safeReturnPath } from '@branchleft/components';
import type { Route } from './+types/theme';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * The site's own origin as the visitor sees it. Behind the TLS-terminating
 * proxy the request URL is plain HTTP, so `x-forwarded-proto` decides the
 * scheme — otherwise an HTTPS `Referer` would never match and every
 * fallback redirect would land on `/`.
 */
function publicOrigin(request: Request): { origin: string; isSecure: boolean } {
  const url = new URL(request.url);
  const isSecure =
    request.headers.get('x-forwarded-proto') === 'https' || url.protocol === 'https:';
  return { origin: `${isSecure ? 'https:' : 'http:'}//${url.host}`, isSecure };
}

/**
 * The no-JavaScript half of the theme switch: `ThemeToggle` posts the theme
 * it wants here, and the reply stores it and sends the visitor back to the
 * page they were on. With JavaScript the component never submits; it writes
 * the same cookie itself.
 */
export async function action({ request }: Route.ActionArgs): Promise<Response> {
  // A body that is not a form (none at all, or JSON) is a bad request, not a
  // server error.
  const form = await request.formData().catch(() => null);
  const theme = form?.get('theme');
  if (theme !== 'light' && theme !== 'dark') {
    return new Response('Unknown theme', { status: 400 });
  }

  const { origin, isSecure } = publicOrigin(request);
  const returnValue = form?.get('return');
  const target = safeReturnPath(
    typeof returnValue === 'string' ? returnValue : request.headers.get('referer'),
    origin
  );
  const secure = isSecure ? '; Secure' : '';
  return redirect(target, {
    status: 303,
    headers: {
      'Set-Cookie': `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`,
    },
  });
}

/** Nothing to show at `/theme` itself; a stray GET goes home. */
export function loader(): Response {
  return redirect('/');
}
