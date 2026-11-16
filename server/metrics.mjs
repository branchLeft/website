// Counter storage for the contact-form send-failure metric, an application
// metric that replaces a log-based one. Plain Node, outside the Vite build,
// because server/metrics-server.mjs requires it directly. The SSR app and that
// listener share a volume, not a process, so the counter lives on disk.
import { readFileSync, writeFileSync } from 'node:fs';

export const METRIC_NAME = 'branchleft_website_contact_form_send_failures_total';

function readCounter(path) {
  try {
    const value = Number(readFileSync(path, 'utf-8').trim());
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function recordContactSendFailure(path) {
  // Read-modify-write, not atomic: safe only while deploy/compose.yml runs one replica.
  // Writes are best-effort, so a lost count must never add a second failure.
  try {
    writeFileSync(path, String(readCounter(path) + 1), 'utf-8');
  } catch (error) {
    console.error('recordContactSendFailure: could not write counter:', error);
  }
}

export function renderMetrics(path) {
  return [
    `# HELP ${METRIC_NAME} Contact form submissions that failed to send.`,
    `# TYPE ${METRIC_NAME} counter`,
    `${METRIC_NAME} ${readCounter(path)}`,
    '',
  ].join('\n');
}
