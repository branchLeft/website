import { data } from 'react-router';

/**
 * Catch-all for paths no other route matches. Throwing the 404 from a loader,
 * rather than letting the router find no match at all, means the root loader
 * still runs first, so the 404 page renders in the visitor's stored theme.
 * The root `ErrorBoundary` renders the page itself.
 */
export function loader(): never {
  throw data(null, { status: 404 });
}

export default function NotFound(): null {
  return null;
}
