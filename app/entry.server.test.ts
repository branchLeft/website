import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntryContext } from 'react-router';

const { renderToPipeableStream } = vi.hoisted(() => ({
  renderToPipeableStream: vi.fn(),
}));

vi.mock('react-dom/server', () => ({
  renderToPipeableStream,
}));

vi.mock('isbot', () => ({
  isbot: () => false,
}));

vi.mock('@react-router/node', () => ({
  createReadableStreamFromReadable: () => new ReadableStream(),
}));

import handleRequest from './entry.server';

// A base64-encoded 16-byte value: exactly the shape
// `randomBytes(16).toString('base64')` produces — 22 data characters plus
// '==' padding (16 % 3 === 1). Confirms the nonce comes from a byte source
// of adequate width, not e.g. Math.random() or a short/guessable string.
const NONCE_SHAPE = /^[A-Za-z0-9+/]{22}==$/;

// Stands in for react-dom/server actually rendering: immediately invokes
// the ready callback (mirroring onShellReady/onAllReady firing synchronously
// for a request with no suspended boundaries) and hands the test everything
// entry.server.tsx passed to renderToPipeableStream — the element (so its
// `nonce` prop can be checked) and the options object (so `options.nonce`
// can be checked against it).
function mockRenderOnce() {
  let captured: { element: unknown; options: Record<string, unknown> } | undefined;
  renderToPipeableStream.mockImplementationOnce((element: unknown, options: any) => {
    captured = { element, options };
    // Real renderToPipeableStream invokes onShellReady asynchronously, after
    // the { pipe, abort } destructuring in entry.server.tsx has completed —
    // calling it synchronously here would reference `pipe` in its temporal
    // dead zone, which the real implementation never does.
    queueMicrotask(() => options.onShellReady());
    return { pipe: vi.fn(), abort: vi.fn() };
  });
  return () => {
    if (!captured) throw new Error('renderToPipeableStream was not called');
    return captured;
  };
}

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/', { headers });
}

function makeRouterContext(): EntryContext {
  return { isSpaMode: false } as unknown as EntryContext;
}

async function run(request: Request) {
  const getCaptured = mockRenderOnce();
  // React Router populates responseHeaders from root.tsx's `headers()`
  // export before entry.server.tsx ever runs, so Strict-Transport-Security
  // is already present here in the real request lifecycle — entry.server.tsx
  // only ever *removes* it (on an insecure request); it never adds it.
  const responseHeaders = new Headers({ 'Strict-Transport-Security': 'max-age=15552000' });
  const response = (await handleRequest(
    request,
    200,
    responseHeaders,
    makeRouterContext()
  )) as Response;
  return { response, captured: getCaptured() };
}

describe('handleRequest nonce generation', () => {
  beforeEach(() => {
    renderToPipeableStream.mockReset();
  });

  it('generates a nonce shaped like 16 crypto-random bytes, base64-encoded', async () => {
    const { captured } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
    expect(captured.options.nonce).toMatch(NONCE_SHAPE);
  });

  it('never produces the same nonce twice across requests', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      const { captured } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
      const nonce = captured.options.nonce as string;
      expect(seen.has(nonce)).toBe(false);
      seen.add(nonce);
    }
  });

  it('uses the same nonce value for both the render options and the <ServerRouter nonce> prop', async () => {
    const { captured } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
    const element = captured.element as { props: { nonce: string } };
    expect(element.props.nonce).toBe(captured.options.nonce);
  });

  it('puts the same nonce into the Content-Security-Policy response header as was used for rendering', async () => {
    const { response, captured } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain(`'nonce-${captured.options.nonce}'`);
  });
});

describe('handleRequest CSP/HSTS environment branching', () => {
  beforeEach(() => {
    renderToPipeableStream.mockReset();
  });

  it('treats x-forwarded-proto: https as secure — upgrade-insecure-requests present, HSTS kept', async () => {
    const { response } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
    expect(response.headers.get('Content-Security-Policy')).toContain('upgrade-insecure-requests');
    expect(response.headers.get('Strict-Transport-Security')).not.toBeNull();
  });

  it('treats a request with no x-forwarded-proto as insecure — omits upgrade-insecure-requests and strips HSTS', async () => {
    const { response } = await run(makeRequest());
    expect(response.headers.get('Content-Security-Policy')).not.toContain(
      'upgrade-insecure-requests'
    );
    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('does not trust a plain (non-forwarded) https:// request URL on its own — only the proxy header decides', async () => {
    // Cloud Run terminates TLS upstream; the container always sees plain
    // HTTP. A request whose URL happens to say https:// but carries no
    // x-forwarded-proto header must still be treated as insecure, or HSTS
    // would be sent on a connection that was never actually secure.
    const insecureRequest = new Request('https://example.branchleft.co.uk/');
    const { response } = await run(insecureRequest);
    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('does not relax script-src on the insecure path — no unsafe-inline/unsafe-eval leak in from the dev/test branch', async () => {
    const { response } = await run(makeRequest());
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toMatch(/unsafe-inline/);
    expect(scriptSrc).not.toMatch(/unsafe-eval/);
  });
});

describe('handleRequest HEAD requests', () => {
  it('responds without rendering (no nonce/CSP work needed for a bodyless response)', async () => {
    renderToPipeableStream.mockReset();
    const responseHeaders = new Headers();
    const response = (await handleRequest(
      new Request('http://localhost/', { method: 'HEAD' }),
      200,
      responseHeaders,
      makeRouterContext()
    )) as Response;

    expect(response.status).toBe(200);
    expect(renderToPipeableStream).not.toHaveBeenCalled();
  });
});
