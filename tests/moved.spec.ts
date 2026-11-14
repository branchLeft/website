import { expect, test } from '@playwright/test';

for (const moved of [
  { from: '/solutions/local-news', to: '/publicpress' },
  { from: '/solutions/affordable-websites', to: '/bespoke#affordable-websites' },
]) {
  test(`${moved.from} permanently redirects to ${moved.to}`, async ({ request }) => {
    const response = await request.get(moved.from, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers()['location']).toBe(moved.to);
  });
}
