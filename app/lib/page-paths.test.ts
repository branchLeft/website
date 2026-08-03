import { describe, expect, it } from 'vitest';
import routes from '../routes';
import { PAGE_PATHS } from './page-paths';

// Resource routes deliberately excluded from PAGE_PATHS/the sitemap — see
// page-paths.ts's module comment.
const RESOURCE_ROUTE_PATHS = new Set(['logo.svg', 'sitemap.xml']);

function routeConfigPaths(): string[] {
  return routes
    .map((r) => r.path)
    .filter((path): path is string => typeof path === 'string' && !RESOURCE_ROUTE_PATHS.has(path))
    .map((path) => `/${path}`);
}

describe('PAGE_PATHS vs app/routes.ts', () => {
  it('lists every indexable route in routes.ts, and nothing extra', () => {
    const fromRoutes = new Set(routeConfigPaths());
    // The index route has no `path` in RouteConfig — it's always `/`.
    fromRoutes.add('/');

    expect(new Set(PAGE_PATHS)).toEqual(fromRoutes);
  });
});
