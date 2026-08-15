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
    const csp = buildContentSecurityPolicy('THE_NONCE');
    const directives = parseDirectives(csp);

    it('gates script-src on self plus the nonce, with no unsafe-inline/unsafe-eval/wildcard', () => {
      expect(directives['script-src']).toEqual(["'self'", "'nonce-THE_NONCE'"]);
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
      const csp = buildContentSecurityPolicy('THE_NONCE', false);
      expect(csp).not.toMatch(/upgrade-insecure-requests/);
    });

    it('still gates script-src on the nonce — the dev/prod split is HSTS/upgrade only', () => {
      const csp = buildContentSecurityPolicy('THE_NONCE', false);
      const directives = parseDirectives(csp);
      expect(directives['script-src']).toEqual(["'self'", "'nonce-THE_NONCE'"]);
      expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    });
  });

  describe('nonce interpolation — current (unvalidated) behaviour', () => {
    // buildContentSecurityPolicy interpolates its `nonce` argument into the
    // header string with no escaping or validation. The real caller
    // (entry.server.tsx) always passes crypto.randomBytes(16).toString
    // ('base64'), whose alphabet [A-Za-z0-9+/=] contains none of the
    // characters below, so this is not reachable on any live path today.
    // These tests document the function's actual behaviour given an
    // out-of-alphabet input, as a discovered defensive-hardening gap
    // rather than a live vulnerability — see the tracked follow-up issue.
    // They are NOT a claim that the current behaviour is safe.

    it('KNOWN GAP: a semicolon in the nonce is interpolated verbatim, producing a second script-src token in the header value', () => {
      const csp = buildContentSecurityPolicy("'; script-src 'unsafe-inline");

      // The function performs no escaping: the semicolon is not neutralised.
      expect(csp).toContain("'nonce-'; script-src 'unsafe-inline'");

      // Not exploitable in a spec-compliant browser: CSP's own duplicate
      // directive rule keeps only the *first* script-src occurrence and
      // ignores the rest, so this can't add unsafe-inline to script-src —
      // but it is still unvalidated data reaching a security header, and a
      // nonce containing '; ' followed by a directive name not already
      // present in the policy would take effect.
      const scriptSrcOccurrences = csp.match(/script-src/g) ?? [];
      expect(scriptSrcOccurrences.length).toBeGreaterThan(1);
    });

    it('a raw CR/LF in the nonce survives buildContentSecurityPolicy() unescaped — the WHATWG Headers API is what actually blocks it, not this function', () => {
      const csp = buildContentSecurityPolicy('abc\r\nSet-Cookie: pwned=1');

      // This function itself does no sanitisation...
      expect(csp).toMatch(/\r\n/);

      // ...so the guarantee that a CRLF-bearing nonce can never reach the
      // wire depends entirely on every call site handing the result to a
      // Headers-API setter, which validates header values and throws
      // rather than silently splitting them. Confirmed against the actual
      // API both production call sites use (responseHeaders.set() in
      // entry.server.tsx; React Router constructs a Headers object from
      // root.tsx's `headers()` return value the same way).
      const headers = new Headers();
      expect(() => headers.set('Content-Security-Policy', csp)).toThrow();
    });
  });
});

describe('buildSecurityHeaders', () => {
  const headers = buildSecurityHeaders('THE_NONCE');

  it('sets the fixed, non-CSP security headers to their exact documented values', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('threads the nonce through into the Content-Security-Policy header it sets', () => {
    expect(headers['Content-Security-Policy']).toContain("'nonce-THE_NONCE'");
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
