import { describe, expect, it } from 'vitest';
import { THEME_COOKIE_NAME } from '@branchleft/components';
import type { Route } from './+types/theme';
import { action, loader } from './theme';

function post(
  fields: Record<string, string>,
  headers: Record<string, string> = {},
  url = 'http://branchleft.test/theme'
): Route.ActionArgs {
  const body = new URLSearchParams(fields);
  const request = new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body,
  });
  return { request, params: {}, context: {} } as unknown as Route.ActionArgs;
}

describe('theme action', () => {
  it.each(['light', 'dark'])('stores %s and sends the visitor back', async (theme) => {
    const response = await action(post({ theme, return: '/about?x=1#team' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe('/about?x=1#team');
    const cookie = response.headers.get('Set-Cookie') ?? '';
    expect(cookie).toContain(`${THEME_COOKIE_NAME}=${theme}`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=31536000');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Secure');
  });

  it('marks the cookie Secure behind the TLS proxy', async () => {
    const response = await action(
      post({ theme: 'light', return: '/' }, { 'x-forwarded-proto': 'https' })
    );

    expect(response.headers.get('Set-Cookie')).toContain('; Secure');
  });

  it.each(['', 'blue', 'light; Path=/evil', 'LIGHT'])(
    'refuses %j without setting a cookie',
    async (theme) => {
      const response = await action(post({ theme, return: '/about' }));

      expect(response.status).toBe(400);
      expect(response.headers.get('Set-Cookie')).toBeNull();
    }
  );

  it('refuses a request with no theme field', async () => {
    const response = await action(post({ return: '/about' }));

    expect(response.status).toBe(400);
  });

  it.each([
    '//evil.example',
    'https://evil.example/',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    `/${'a'.repeat(3000)}`,
  ])('never redirects off-site for return=%j', async (hostile) => {
    const response = await action(post({ theme: 'light', return: hostile }));

    const location = response.headers.get('Location') ?? '';
    expect(location.startsWith('/')).toBe(true);
    expect(location.startsWith('//')).toBe(false);
    expect(location).not.toContain('evil.example');
  });

  it('falls back to a same-site Referer when no return field is sent', async () => {
    const response = await action(
      post(
        { theme: 'dark' },
        { referer: 'https://branchleft.test/contact', 'x-forwarded-proto': 'https' }
      )
    );

    expect(response.headers.get('Location')).toBe('/contact');
  });

  it('ignores an off-site Referer', async () => {
    const response = await action(
      post({ theme: 'dark' }, { referer: 'https://evil.example/phish' })
    );

    expect(response.headers.get('Location')).toBe('/');
  });
});

describe('theme loader', () => {
  it('sends a stray GET home', () => {
    const response = loader();

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/');
  });
});
