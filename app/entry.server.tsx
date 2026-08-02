import { PassThrough } from 'node:stream';
import { randomBytes } from 'node:crypto';

import type { EntryContext } from 'react-router';
import { createReadableStreamFromReadable } from '@react-router/node';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';
import { buildContentSecurityPolicy } from './lib/security-headers';

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get('user-agent');

    // Per-request nonce for the inline <script> tags React Router's
    // <Scripts /> emits for hydration (the __reactRouterContext assignment
    // and the route-modules import map) — see app/lib/security-headers.ts.
    // 16 random bytes, base64-encoded, per the CSP nonce recommendation:
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce
    let nonce = randomBytes(16).toString('base64');

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady';

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000
    );

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} nonce={nonce} />,
      {
        nonce,
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              // Clear the timeout to prevent retaining the closure and memory leak
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');

          // Cloud Run terminates TLS upstream and forwards to this
          // container over plain HTTP with `X-Forwarded-Proto: https` set —
          // that header, not the request's own URL scheme, is the real
          // signal for whether the original connection was secure.
          // `pnpm start`/the e2e test server (plain HTTP, no proxy) has no
          // such header, so `isSecure` is correctly `false` there.
          const isSecure = request.headers.get('x-forwarded-proto') === 'https';

          // Override root.tsx's nonce-less CSP with the nonce-bearing
          // version now that one exists — see app/lib/security-headers.ts.
          // `isSecure` matters here: `upgrade-insecure-requests` is a live,
          // per-response instruction, not something that needs a prior
          // secure connection or any cache to take effect. Sent on a
          // plain-HTTP response, it still force-upgrades every same-page
          // subresource request to HTTPS, which fails outright against a
          // server with no TLS listener — breaking asset loading and
          // hydration entirely. (Confirmed this is the actual cause, not
          // just a theoretical one: reproduced with a byte-for-byte fresh
          // WebKit profile and zero other security headers present, so nothing
          // about it depends on a cached browser-side HSTS decision.)
          responseHeaders.set(
            'Content-Security-Policy',
            buildContentSecurityPolicy(nonce, isSecure)
          );

          // Strict-Transport-Security has the same problem for a different
          // reason: it's meaningless (and, unlike the above, actively
          // harmful the moment ANY response on the origin carries it, since
          // it's a persistent, origin-wide browser decision) on a response
          // that didn't arrive over HTTPS.
          if (!isSecure) {
            responseHeaders.delete('Strict-Transport-Security');
          }

          pipe(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );
  });
}
