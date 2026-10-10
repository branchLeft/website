import { randomBytes } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, buildSecurityHeaders } from './security-headers';

// Splits a CSP header into its directives, keyed by directive name, so
// assertions target one directive at a time instead of the whole string.
function parseDirectives(csp: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const part of csp.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const [name, ...values] = tokens;
    result[name] = values;
  }
  return result;
}

describe('buildContentSecurityPolicy', () => {
  describe('production path (isSecure default true, with a nonce)', () => {
    const csp = buildContentSecurityPolicy('TEST_NONCE_01234567890A');
    const directives = parseDirectives(csp);

    it('gates script-src on self plus the nonce, with no unsafe-inline/unsafe-eval/wildcard', () => {
      expect(directives['script-src']).toEqual(["'self'", "'nonce-TEST_NONCE_01234567890A'"]);
      expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
      expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/);
      expect(csp).not.toMatch(/script-src[^;]*\*/);
    });

    it('restricts default-src, img-src, font-src, connect-src, form-action to self', () => {
      expect(directives['default-src']).toEqual(["'self'"]);
      expect(directives['img-src']).toEqual(["'self'"]);
      expect(directives['font-src']).toEqual(["'self'"]);
      expect(directives['connect-src']).toEqual(["'self'"]);
      expect(directives['form-action']).toEqual(["'self'"]);
    });

    it('blocks framing and plugin content outright', () => {
      expect(directives['frame-ancestors']).toEqual(["'none'"]);
      expect(directives['object-src']).toEqual(["'none'"]);
    });

    it('pins base-uri to self, preventing a <base> tag from redirecting relative URLs', () => {
      expect(directives['base-uri']).toEqual(["'self'"]);
    });

    it('carries the documented, scoped style-src exception and nothing broader', () => {
      // style-src 'unsafe-inline' is a deliberate, scoped compromise (SSR'd
      // framer-motion inline styles) — see the comment on STYLE_SRC in
      // security-headers.ts. Inline styles can't execute script, so this is
      // not equivalent to relaxing script-src.
      expect(directives['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
      expect(csp).not.toMatch(/style-src[^;]*unsafe-eval/);
    });

    it('force-upgrades subresources to HTTPS when the request was secure', () => {
      expect(csp).toMatch(/(^|;\s*)upgrade-insecure-requests(;|$)/);
    });

    it('never carries a wildcard source anywhere in the policy', () => {
      for (const [name, values] of Object.entries(directives)) {
        expect(values, `${name} must not include a wildcard source`).not.toContain('*');
      }
    });
  });

  describe('no nonce supplied (root.tsx pre-render path)', () => {
    it('falls back script-src to self with no nonce token', () => {
      const directives = parseDirectives(buildContentSecurityPolicy());
      expect(directives['script-src']).toEqual(["'self'"]);
    });
  });

  describe('isSecure=false (plain-HTTP dev/test server)', () => {
    it('omits upgrade-insecure-requests, which would break asset loading with no TLS listener', () => {
      const csp = buildContentSecurityPolicy('TEST_NONCE_01234567890A', false);
      expect(csp).not.toMatch(/upgrade-insecure-requests/);
    });

    it('still gates script-src on the nonce — the dev/prod split is HSTS/upgrade only', () => {
      const csp = buildContentSecurityPolicy('TEST_NONCE_01234567890A', false);
      const directives = parseDirectives(csp);
      expect(directives['script-src']).toEqual(["'self'", "'nonce-TEST_NONCE_01234567890A'"]);
      expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    });
  });

  describe('nonce validation (fail closed on anything outside the base64 / URL-safe token shape)', () => {
    const hostileNonces: Array<[string, unknown]> = [
      ['a single quote', "abc'def"],
      ['a semicolon that opens a second directive', "'; script-src 'unsafe-inline"],
      ['a bare semicolon', 'abc;def'],
      ['a raw newline', 'abc\ndef'],
      ['a CRLF header injection', 'abc\r\nSet-Cookie: pwned=1'],
      ['a space', 'abc def'],
      ['a trailing newline after a valid token', 'A'.repeat(22) + '\n'],
      ['a leading newline before a valid token', '\n' + 'A'.repeat(22)],
      ['the directive name itself', 'script-src'],
      ['a token one character below the 22-character floor', 'A'.repeat(21)],
      ['a short token well below the floor', 'abc123XYZ'],
      ['an empty string', ''],
      ['an over-long token (129 characters)', 'A'.repeat(129)],
      ['a number', 12345],
      ['an object', { toString: () => 'abc' }],
      ['an array', ['abc']],
    ];

    it.each(hostileNonces)('throws for %s, and never returns a header string', (_label, nonce) => {
      expect(() => buildContentSecurityPolicy(nonce as string)).toThrow(TypeError);
    });

    it('rejects a hostile nonce on the buildSecurityHeaders path too', () => {
      expect(() => buildSecurityHeaders("x'; script-src 'unsafe-inline")).toThrow(TypeError);
    });

    it('accepts the shortest permitted token (22 characters, 128 bits)', () => {
      const nonce = 'A'.repeat(22);
      const directives = parseDirectives(buildContentSecurityPolicy(nonce));
      expect(directives['script-src']).toEqual(["'self'", `'nonce-${nonce}'`]);
    });

    it('accepts the longest permitted token (128 characters)', () => {
      const csp = buildContentSecurityPolicy('A'.repeat(128));
      expect(parseDirectives(csp)['script-src']).toEqual(["'self'", `'nonce-${'A'.repeat(128)}'`]);
    });

    it('production path: every nonce from the real generator clears validation and interpolates', () => {
      // Same generator as app/entry.server.tsx: 16 random bytes, base64.
      for (let i = 0; i < 200; i++) {
        const nonce = randomBytes(16).toString('base64');
        const directives = parseDirectives(buildContentSecurityPolicy(nonce));
        expect(directives['script-src']).toEqual(["'self'", `'nonce-${nonce}'`]);
      }
    });

    it('control: a valid base64 nonce, the exact shape the real caller produces, still interpolates', () => {
      // crypto.randomBytes(16).toString('base64') is 24 characters ending in '=='.
      const nonce = 'q2Xb7Lr0VbM1pT9sYw8ZNw==';
      const directives = parseDirectives(buildContentSecurityPolicy(nonce));
      expect(directives['script-src']).toEqual(["'self'", `'nonce-${nonce}'`]);
    });

    it('control: a valid URL-safe nonce still interpolates', () => {
      const nonce = 'abc-_XYZ0123456789ABCDEF';
      const directives = parseDirectives(buildContentSecurityPolicy(nonce, false));
      expect(directives['script-src']).toEqual(["'self'", `'nonce-${nonce}'`]);
    });
  });
});

describe('buildSecurityHeaders', () => {
  const headers = buildSecurityHeaders('TEST_NONCE_01234567890A');

  it('sets the fixed, non-CSP security headers to their exact documented values', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('threads the nonce through into the Content-Security-Policy header it sets', () => {
    expect(headers['Content-Security-Policy']).toContain("'nonce-TEST_NONCE_01234567890A'");
  });

  describe('Permissions-Policy', () => {
    const entries = headers['Permissions-Policy'].split(', ');

    it('disables every listed feature (empty allowlist), not just a subset', () => {
      for (const entry of entries) {
        expect(entry).toMatch(/^[a-z-]+=\(\)$/);
      }
    });

    it('covers the camera/microphone/geolocation/payment surface explicitly', () => {
      expect(entries).toEqual(
        expect.arrayContaining(['camera=()', 'microphone=()', 'geolocation=()', 'payment=()'])
      );
    });
  });

  describe('Strict-Transport-Security', () => {
    const hsts = headers['Strict-Transport-Security'];

    it('sets a max-age measured in months, not left at 0 or unset', () => {
      const match = hsts.match(/max-age=(\d+)/);
      expect(match).not.toBeNull();
      const maxAge = Number(match?.[1]);
      const oneDay = 24 * 60 * 60;
      expect(maxAge).toBeGreaterThanOrEqual(30 * oneDay);
      // Sanity ceiling: catches an accidental extra digit (e.g. 10x too large).
      expect(maxAge).toBeLessThanOrEqual(365 * oneDay);
    });

    // includeSubDomains and preload are each a one-way, origin-wide
    // commitment (preload especially — submission is not reversible on a
    // human timescale). The current value omits both deliberately; this
    // pins that decision so a future edit changes it on purpose, not by
    // accident of string-editing the max-age.
    it('deliberately omits includeSubDomains', () => {
      expect(hsts).not.toMatch(/includeSubDomains/);
    });

    it('deliberately omits preload', () => {
      expect(hsts).not.toMatch(/preload/);
    });
  });
});
