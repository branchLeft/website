import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn();
  const createTransport = vi.fn(() => ({ sendMail }));
  return { sendMail, createTransport };
});

vi.mock('nodemailer', () => ({
  default: { createTransport },
}));

import { sendContactEmail } from './sendContactEmail.server';

const ORIGINAL_ENV = { ...process.env };

function setEnv(user: string | undefined, pass: string | undefined) {
  if (user === undefined) {
    delete process.env.GMAIL_USER;
  } else {
    process.env.GMAIL_USER = user;
  }
  if (pass === undefined) {
    delete process.env.GMAIL_APP_PASSWORD;
  } else {
    process.env.GMAIL_APP_PASSWORD = pass;
  }
}

describe('sendContactEmail', () => {
  beforeEach(() => {
    sendMail.mockReset().mockResolvedValue(undefined);
    createTransport.mockClear();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('throws without sending when GMAIL_USER is not set', async () => {
    setEnv(undefined, 'app-password');

    await expect(
      sendContactEmail({
        category: 'general',
        email: 'person@example.com',
        message: 'hello there',
      })
    ).rejects.toThrow('GMAIL_USER and GMAIL_APP_PASSWORD must be set to send contact form email.');
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('throws without sending when GMAIL_APP_PASSWORD is not set', async () => {
    setEnv('info@branchleft.co.uk', undefined);

    await expect(
      sendContactEmail({
        category: 'general',
        email: 'person@example.com',
        message: 'hello there',
      })
    ).rejects.toThrow('GMAIL_USER and GMAIL_APP_PASSWORD must be set to send contact form email.');
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('builds a gmail transport from the configured credentials', async () => {
    setEnv('info@branchleft.co.uk', 'super-secret-app-password');

    await sendContactEmail({
      category: 'general',
      email: 'person@example.com',
      message: 'hello there',
    });

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'info@branchleft.co.uk', pass: 'super-secret-app-password' },
    });
  });

  it('sends to the fixed inbox with the submitter wired up as replyTo', async () => {
    setEnv('info@branchleft.co.uk', 'super-secret-app-password');

    await sendContactEmail({
      category: 'affordable-websites',
      email: 'someone@example.com',
      message: 'Please can you build me a site.',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'branchLeft website <info@branchleft.co.uk>',
      to: 'info+enquiry@branchleft.co.uk',
      replyTo: 'someone@example.com',
      subject: '🔔 Website enquiry: affordable-websites',
      text: [
        'NEW WEBSITE ENQUIRY — branchLeft',
        '--------------------------------',
        'Category: affordable-websites',
        'From:     someone@example.com',
        '',
        'Message:',
        'Please can you build me a site.',
        '--------------------------------',
        '(Reply-To is already set to the sender — hit reply.)',
      ].join('\n'),
      html: expect.stringContaining('someone@example.com'),
    });
  });

  it('propagates a rejection from the transport instead of swallowing it', async () => {
    setEnv('info@branchleft.co.uk', 'super-secret-app-password');
    sendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

    await expect(
      sendContactEmail({
        category: 'general',
        email: 'person@example.com',
        message: 'hello there',
      })
    ).rejects.toThrow('SMTP connection refused');
  });
});
