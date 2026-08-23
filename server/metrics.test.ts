import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { METRIC_NAME, recordContactSendFailure, renderMetrics } from './metrics.mjs';

let dir: string;
let counterPath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'branchleft-metrics-'));
  counterPath = join(dir, 'contact-send-failures.count');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('renderMetrics', () => {
  it('reports zero when the counter file does not exist yet', () => {
    const rendered = renderMetrics(counterPath);
    expect(rendered).toContain(`${METRIC_NAME} 0`);
  });

  it('reports zero for a counter file that is not a valid non-negative number', () => {
    for (const contents of ['', 'not-a-number', '-3', 'NaN']) {
      writeFileSync(counterPath, contents, 'utf-8');
      expect(renderMetrics(counterPath)).toContain(`${METRIC_NAME} 0`);
    }
  });

  it('emits Prometheus HELP/TYPE lines for a counter', () => {
    const rendered = renderMetrics(counterPath);
    expect(rendered).toContain(`# HELP ${METRIC_NAME}`);
    expect(rendered).toContain(`# TYPE ${METRIC_NAME} counter`);
  });
});

describe('recordContactSendFailure', () => {
  it('starts the counter at 1 on the first failure', () => {
    recordContactSendFailure(counterPath);
    expect(readFileSync(counterPath, 'utf-8')).toBe('1');
  });

  it('increments across repeated failures', () => {
    recordContactSendFailure(counterPath);
    recordContactSendFailure(counterPath);
    recordContactSendFailure(counterPath);
    expect(renderMetrics(counterPath)).toContain(`${METRIC_NAME} 3`);
  });

  it('recovers from a corrupted counter file by treating it as zero', () => {
    writeFileSync(counterPath, 'garbage', 'utf-8');
    recordContactSendFailure(counterPath);
    expect(readFileSync(counterPath, 'utf-8')).toBe('1');
  });

  it('does not throw when the write fails, and logs instead', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const unwritablePath = join(dir, 'no-such-directory', 'contact-send-failures.count');

    expect(() => recordContactSendFailure(unwritablePath)).not.toThrow();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
