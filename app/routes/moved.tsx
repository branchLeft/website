import { redirect } from 'react-router';
import type { Route } from './+types/moved';

/** Old address → the page that now carries its content. */
const MOVED: Readonly<Record<string, string>> = {
  '/solutions/local-news': '/publicpress',
  '/solutions/affordable-websites': '/bespoke#affordable-websites',
};

export function loader({ request }: Route.LoaderArgs): Response {
  const { pathname } = new URL(request.url);
  return redirect(MOVED[pathname.replace(/\/$/, '')] ?? '/', 301);
}
