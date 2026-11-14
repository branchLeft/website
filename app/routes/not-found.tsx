import { data } from 'react-router';

/**
 * Catch-all 404. Throwing from the loader, rather than matching nothing, lets
 * the root loader run first, so the page renders in the visitor's stored theme.
 */
export function loader(): never {
  throw data(null, { status: 404 });
}

/** A POST to an unknown path is a 404 too, not a 405. */
export function action(): never {
  throw data(null, { status: 404 });
}

export default function NotFound(): null {
  return null;
}
