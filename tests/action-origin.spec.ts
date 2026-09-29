import { expect, test } from '@playwright/test';

// In production the server sees `http://` requests from the TLS edge while
// browsers send `Origin: https://branchleft.co.uk`. React Router refuses an
// action whose Origin differs from the request's own, unless the host is in
// `allowedActionOrigins` (react-router.config.ts). These posts reproduce that
// mismatch against the local http server.
const SITE = 'https://branchleft.co.uk';
const FOREIGN = 'https://evil.example';

// `renderedAt=0` trips the contact action's bot check, which answers success
// without sending any email.
const CONTACT_FORM = { category: '', email: '', message: '', renderedAt: '0' };

for (const [origin, allowed] of [
  [SITE, true],
  [FOREIGN, false],
] as const) {
  test(`a contact form post from ${origin} is ${allowed ? 'accepted' : 'refused'}`, async ({
    request,
  }) => {
    const response = await request.post('/contact.data', {
      headers: { origin },
      form: CONTACT_FORM,
    });
    expect(response.status()).toBe(allowed ? 200 : 400);
  });
}

// A plain (no-JavaScript) form post is a document request, which React Router
// does not origin-check at all; this only pins that the switch works from the
// production origin. A cross-site post can at most change a visitor's theme.
test('a no-JavaScript theme post from the production origin is accepted', async ({ request }) => {
  const response = await request.post('/theme', {
    headers: { origin: SITE },
    form: { theme: 'light', return: '/about' },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
});
