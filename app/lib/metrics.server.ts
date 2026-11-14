import { recordContactSendFailure as record } from '../../server/metrics.mjs';

/**
 * Increments the contact-form send-failure counter read by Prometheus
 * (server/metrics-server.mjs). A no-op when CONTACT_METRICS_PATH is unset.
 */
export function recordContactSendFailure(): void {
  const path = process.env.CONTACT_METRICS_PATH;
  if (!path) {
    return;
  }
  record(path);
}
