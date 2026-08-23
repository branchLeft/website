import { recordContactSendFailure as record } from '../../server/metrics.mjs';

/**
 * Increments the contact-form send-failure counter the website-metrics
 * Compose service exposes to Prometheus (see server/metrics-server.mjs).
 *
 * A no-op when CONTACT_METRICS_PATH is unset (local dev, CI, and any
 * environment with no metrics volume mounted) rather than throwing --  a
 * missing metrics path must not turn an already-failed send into a second,
 * unrelated failure.
 */
export function recordContactSendFailure(): void {
  const path = process.env.CONTACT_METRICS_PATH;
  if (!path) {
    return;
  }
  record(path);
}
