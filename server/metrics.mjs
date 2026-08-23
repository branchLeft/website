// Counter storage for the contact-form send-failure metric (doc 14 §9.2:
// an application metric replacing a Cloud Logging log-based one).
//
// Plain Node, deliberately outside the Vite/React Router build: this file
// is required directly by server/metrics-server.mjs, a standalone process
// that never goes through that build. The SSR app and the metrics listener
// run as separate Compose services (deploy/compose.yml) sharing one volume,
// so the counter has to live on disk rather than in a module-level
// variable -- there is no shared process for an in-memory counter to live in.
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
  // Read-modify-write, not atomic -- safe only because deploy/compose.yml
  // runs exactly one `website` replica, so there is never a second writer to
  // race against. A second app replica would need a real counter (e.g. one
  // maintained by the metrics service itself) rather than a shared file.
  //
  // A metrics write is best-effort: the volume it targets can be full or
  // wrong-permissioned for reasons unrelated to (and plausibly correlated
  // with) the send failure this counts. Losing a count must never turn
  // into a second, user-visible failure on top of the first.
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
