#!/usr/bin/env node
// Standalone Prometheus endpoint for the counter server/metrics.mjs
// maintains. Its own Compose service (deploy/compose.yml) so the port can
// be bound to app1's private address independently of the app container's
// own port -- nothing about this listener runs through Caddy or the
// website's own hostnames.
import { createServer } from 'node:http';
import { renderMetrics } from './metrics.mjs';

const port = Number(process.env.METRICS_PORT ?? 9092);
const counterPath = process.env.CONTACT_METRICS_PATH;
if (!counterPath) {
  throw new Error('CONTACT_METRICS_PATH must be set');
}

createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/metrics') {
    res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' });
    res.end(renderMetrics(counterPath));
    return;
  }
  res.writeHead(404);
  res.end();
}).listen(port);
