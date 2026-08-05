# Known issues

## Pre-rendering is off — enabling it would ship pages with no security headers

**Symptom:** would be silent. Adding a path to the `prerender` array in
`react-router.config.ts` doesn't error; it just changes what headers that
page ships with in production.

**Why it matters:** `@react-router/serve`'s server (see its `cli.js`)
registers `express.static` for both `build/client` (where prerendered
`.html` files land) and `public/`, and both run _before_ the SSR catch-all
handler that applies `root.tsx`'s `headers()` export and
`entry.server.tsx`'s per-request CSP nonce. A prerendered page is served
straight off disk by `express.static` — the request never reaches the code
that sets those headers, so the page would ship with no CSP, no HSTS, no
X-Frame-Options, etc.

There's a second, independent problem: a nonce baked into a prerendered
page at build time is fixed forever, which defeats nonce-based CSP even if
the header-ordering issue above is fixed.

`contact.tsx` has its own, separate reason to stay excluded even after the
above is fixed: its loader stamps `renderedAt: Date.now()` for the anti-bot
minimum-time-on-page check. Prerendering that route would freeze
`renderedAt` at build time, silently defeating the check for the life of
the deployed build.

**How to apply:** do not add any path to the `prerender` array until this
is fixed. Fixing it needs its own design — e.g. LB-level header injection via
the edge load balancer's URL map `HeaderAction` (that program now lives in a
separate private infrastructure repo, not in this one), or an Express wrapper
reapplying `buildSecurityHeaders()`/nonce-rewriting to static files — not a
drive-by config change. `contact.tsx` (and any future route with
per-request anti-bot/freshness state) must stay excluded from `prerender`
regardless of whether the header problem gets solved.
