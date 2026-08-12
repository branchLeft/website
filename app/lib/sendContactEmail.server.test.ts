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

function setEnv(
  host: string | undefined,
  port: string | undefined,
  user: string | undefined,
  pass: string | undefined
) {
  for (const [key, value] of [
    ['CONTACT_SMTP_HOST', host],
    ['CONTACT_SMTP_PORT', port],
    ['CONTACT_SMTP_USER', user],
    ['CONTACT_SMTP_PASSWORD', pass],
  ] as const) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

const VALID_ENV = [
  'smtp.example.branchleft.co.uk',
  '587',
  'website-submission@branchleft.co.uk',
  'super-secret',
] as const;

describe('sendContactEmail', () => {
  beforeEach(() => {
    sendMail.mockReset().mockResolvedValue(undefined);
    createTransport.mockClear();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('throws without sending when CONTACT_SMTP_HOST is not set', async () => {
    setEnv(undefined, VALID_ENV[1], VALID_ENV[2], VALID_ENV[3]);

    await expect(
      sendContactEmail({
        category: 'general',
        email: 'person@example.com',
        message: 'hello there',
      })
    ).rejects.toThrow(
      'CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_USER and CONTACT_SMTP_PASSWORD must all be set to send contact form email.'
    );
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('throws without sending when CONTACT_SMTP_PORT is not set', async () => {
    setEnv(VALID_ENV[0], undefined, VALID_ENV[2], VALID_ENV[3]);

    await expect(
      sendContactEmail({
        category: 'general',
        email: 'person@example.com',
        message: 'hello there',
      })
    ).rejects.toThrow(
      'CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_USER and CONTACT_SMTP_PASSWORD must all be set to send contact form email.'
    );
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('throws without sending when CONTACT_SMTP_USER is not set', async () => {
    setEnv(VALID_ENV[0], VALID_ENV[1], undefined, VALID_ENV[3]);

    await expect(
      sendContactEmail({
        category: 'general',
        email: 'person@example.com',
        message: 'hello there',
      })
    ).rejects.toThrow(
      'CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_USER and CONTACT_SMTP_PASSWORD must all be set to send contact form email.'
    );
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('throws without sending when CONTACT_SMTP_PASSWORD is not set', async () => {
    setEnv(VALID_ENV[0], VALID_ENV[1], VALID_ENV[2], undefined);

    await expect(
      sendContactEmail({
        category: 'general',
        email: 'person@example.com',
        message: 'hello there',
      })
    ).rejects.toThrow(
      'CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_USER and CONTACT_SMTP_PASSWORD must all be set to send contact form email.'
    );
    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('builds an SMTP transport from the configured credentials, forcing STARTTLS on the submission port', async () => {
    setEnv(...VALID_ENV);

    await sendContactEmail({
      category: 'general',
      email: 'person@example.com',
      message: 'hello there',
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.branchleft.co.uk',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: 'website-submission@branchleft.co.uk', pass: 'super-secret' },
    });
  });

  it('sends to the fixed inbox with the submitter wired up as replyTo', async () => {
    setEnv(...VALID_ENV);

    await sendContactEmail({
      category: 'affordable-websites',
      email: 'someone@example.com',
      message: 'Please can you build me a site.',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'branchLeft website <website-submission@branchleft.co.uk>',
      to: 'info@branchleft.co.uk',
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
    setEnv(...VALID_ENV);
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
