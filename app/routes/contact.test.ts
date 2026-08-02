import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Route } from './+types/contact';

vi.mock('../lib/sendContactEmail.server', () => ({
  sendContactEmail: vi.fn(),
}));

import { sendContactEmail } from '../lib/sendContactEmail.server';
import {
  EMAIL_MAX_LENGTH,
  HONEYPOT_FIELD_NAME,
  MESSAGE_MAX_LENGTH,
  MIN_SUBMIT_DELAY_MS,
  RATE_LIMIT_MAX_SUBMISSIONS,
  action,
  isKnownCategory,
  loader,
} from './contact';

describe('isKnownCategory', () => {
  it('accepts known category slugs', () => {
    expect(isKnownCategory('local-news')).toBe(true);
    expect(isKnownCategory('affordable-websites')).toBe(true);
    expect(isKnownCategory('bespoke-technology')).toBe(true);
    expect(isKnownCategory('general')).toBe(true);
  });

  it('rejects unknown or malicious values', () => {
    expect(isKnownCategory('not-a-category')).toBe(false);
    expect(isKnownCategory('<script>alert(1)</script>')).toBe(false);
    expect(isKnownCategory('')).toBe(false);
    expect(isKnownCategory(null)).toBe(false);
  });
});

describe('loader', () => {
  it('stamps the current time as renderedAt', async () => {
    const before = Date.now();
    const result = await loader();
    const after = Date.now();
    expect(result.renderedAt).toBeGreaterThanOrEqual(before);
    expect(result.renderedAt).toBeLessThanOrEqual(after);
  });
});

// A human-plausible submission: honeypot empty, and the page was "rendered"
// well before MIN_SUBMIT_DELAY_MS ago.
function buildFormData(overrides: Partial<Record<string, string>> = {}): FormData {
  const fields: Record<string, string> = {
    category: 'general',
    email: 'person@example.com',
    message: 'x'.repeat(40),
    [HONEYPOT_FIELD_NAME]: '',
    renderedAt: String(Date.now() - MIN_SUBMIT_DELAY_MS - 5000),
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

function makeRequest(formData: FormData, ip: string): Request {
  return new Request('http://localhost/contact', {
    method: 'POST',
    body: formData,
    headers: { 'x-forwarded-for': ip },
  });
}

// `action`'s only used field is `request`; the rest of Route.ActionArgs
// (url, pattern, params, context) is irrelevant to this route's logic.
function actionArgs(request: Request): Route.ActionArgs {
  return { request } as unknown as Route.ActionArgs;
}

let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

describe('action', () => {
  beforeEach(() => {
    vi.mocked(sendContactEmail).mockReset().mockResolvedValue(undefined);
  });

  it('sends the email for a valid, human-looking submission', async () => {
    const result = await action(actionArgs(makeRequest(buildFormData(), nextIp())));

    expect(result).toEqual({ ok: true });
    expect(sendContactEmail).toHaveBeenCalledWith({
      category: 'general',
      email: 'person@example.com',
      message: 'x'.repeat(40),
    });
  });

  it('rejects an unknown category', async () => {
    const formData = buildFormData({ category: 'not-a-category' });
    const result = await action(actionArgs(makeRequest(formData, nextIp())));

    expect(result).toEqual({ ok: false, error: 'Please select a valid category.' });
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('rejects an email over the maximum length', async () => {
    const longEmail = `${'a'.repeat(EMAIL_MAX_LENGTH)}@example.com`;
    const formData = buildFormData({ email: longEmail });
    const result = await action(actionArgs(makeRequest(formData, nextIp())));

    expect(result.ok).toBe(false);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('rejects a message under the minimum length', async () => {
    const formData = buildFormData({ message: 'too short' });
    const result = await action(actionArgs(makeRequest(formData, nextIp())));

    expect(result).toEqual({
      ok: false,
      error: 'Please provide a bit more detail in your message.',
    });
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('rejects a message over the maximum length', async () => {
    const formData = buildFormData({ message: 'x'.repeat(MESSAGE_MAX_LENGTH + 1) });
    const result = await action(actionArgs(makeRequest(formData, nextIp())));

    expect(result.ok).toBe(false);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('silently succeeds without sending when the honeypot field is filled', async () => {
    const formData = buildFormData({ [HONEYPOT_FIELD_NAME]: 'Acme Corp' });
    const result = await action(actionArgs(makeRequest(formData, nextIp())));

    expect(result).toEqual({ ok: true });
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('silently succeeds without sending when submitted faster than a human plausibly could', async () => {
    const formData = buildFormData({ renderedAt: String(Date.now()) });
    const result = await action(actionArgs(makeRequest(formData, nextIp())));

    expect(result).toEqual({ ok: true });
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('silently succeeds without sending when renderedAt is missing or malformed', async () => {
    const formData = buildFormData({ renderedAt: 'not-a-number' });
    const result = await action(actionArgs(makeRequest(formData, nextIp())));

    expect(result).toEqual({ ok: true });
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('rate-limits repeated submissions from the same IP', async () => {
    const ip = nextIp();

    for (let i = 0; i < RATE_LIMIT_MAX_SUBMISSIONS; i += 1) {
      const result = await action(actionArgs(makeRequest(buildFormData(), ip)));
      expect(result.ok).toBe(true);
    }
    vi.mocked(sendContactEmail).mockClear();

    const result = await action(actionArgs(makeRequest(buildFormData(), ip)));

    expect(result.ok).toBe(false);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('does not rate-limit a fresh IP after another IP is exhausted', async () => {
    const exhaustedIp = nextIp();
    for (let i = 0; i < RATE_LIMIT_MAX_SUBMISSIONS + 1; i += 1) {
      await action(actionArgs(makeRequest(buildFormData(), exhaustedIp)));
    }
    vi.mocked(sendContactEmail).mockClear();

    const result = await action(actionArgs(makeRequest(buildFormData(), nextIp())));

    expect(result).toEqual({ ok: true });
    expect(sendContactEmail).toHaveBeenCalledTimes(1);
  });
});
