#!/usr/bin/env node
// Standalone Prometheus endpoint for the counter in server/metrics.mjs. Its own
// Compose service, so its port binds independently of the app container. Nothing
// here runs through Caddy or the website's hostnames.
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
