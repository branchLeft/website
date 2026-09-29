import nodemailer from 'nodemailer';
import { branchLeftTokens } from '@branchleft/brand-branchleft';

export type ContactSubmission = {
  readonly category: string;
  readonly email: string;
  readonly message: string;
};

const TO_ADDRESS = 'info@branchleft.co.uk';

/**
 * The email's colours: the brand's dark palette, as literal values because
 * email clients support no CSS custom properties. Every text colour here
 * clears 4.5:1 on `background` (checked in the unit test).
 */
const { colour } = branchLeftTokens;
export const EMAIL_PALETTE = {
  background: colour.background.dark,
  text: colour.foreground.dark,
  accent: colour.brandAccent.dark,
  muted: colour.muted.dark,
  rule: colour.brand.dark,
  divider: colour.hairline.dark,
} as const;

function getTransport() {
  const host = process.env.CONTACT_SMTP_HOST;
  const port = process.env.CONTACT_SMTP_PORT;
  const user = process.env.CONTACT_SMTP_USER;
  const pass = process.env.CONTACT_SMTP_PASSWORD;
  if (!host || !port || !user || !pass) {
    throw new Error(
      'CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_USER and CONTACT_SMTP_PASSWORD must all be set to send contact form email.'
    );
  }
  const portNumber = Number(port);
  if (Number.isNaN(portNumber)) {
    throw new TypeError(`CONTACT_SMTP_PORT must be a number, got: ${port}`);
  }
  return nodemailer.createTransport({
    host,
    port: portNumber,
    // Submission ports (587) negotiate encryption via STARTTLS rather than
    // starting TLS immediately, unlike 465's implicit TLS. requireTLS
    // forces that upgrade instead of silently falling back to plaintext.
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildText(submission: ContactSubmission): string {
  return [
    'NEW WEBSITE ENQUIRY — branchLeft',
    '--------------------------------',
    `Category: ${submission.category}`,
    `From:     ${submission.email}`,
    '',
    'Message:',
    submission.message,
    '--------------------------------',
    '(Reply-To is already set to the sender — hit reply.)',
  ].join('\n');
}

function buildHtml(submission: ContactSubmission): string {
  const category = escapeHtml(submission.category);
  const email = escapeHtml(submission.email);
  const message = escapeHtml(submission.message).replaceAll('\n', '<br>');
  return `
    <div style="font-family: Helvetica, Arial, sans-serif; background: ${EMAIL_PALETTE.background}; color: ${EMAIL_PALETTE.text}; padding: 24px; max-width: 560px; margin: 0 auto;">
      <div style="border-bottom: 3px solid ${EMAIL_PALETTE.rule}; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: bold; letter-spacing: 0.02em;">branch<span style="color: ${EMAIL_PALETTE.accent};">Left</span></span>
        <div style="color: ${EMAIL_PALETTE.accent}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px;">New website enquiry</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="color: ${EMAIL_PALETTE.accent}; font-size: 13px; padding: 4px 12px 4px 0; vertical-align: top; white-space: nowrap;">Category</td>
          <td style="font-size: 14px; padding: 4px 0;">${category}</td>
        </tr>
        <tr>
          <td style="color: ${EMAIL_PALETTE.accent}; font-size: 13px; padding: 4px 12px 4px 0; vertical-align: top; white-space: nowrap;">From</td>
          <td style="font-size: 14px; padding: 4px 0;"><a href="mailto:${email}" style="color: ${EMAIL_PALETTE.accent};">${email}</a></td>
        </tr>
      </table>
      <div style="border-top: 1px solid ${EMAIL_PALETTE.divider}; padding-top: 16px; font-size: 14px; line-height: 1.6;">
        ${message}
      </div>
      <div style="border-top: 1px solid ${EMAIL_PALETTE.divider}; margin-top: 20px; padding-top: 12px; font-size: 12px; color: ${EMAIL_PALETTE.muted};">
        Reply-To is already set to the sender — hit reply to respond directly.
      </div>
    </div>
  `;
}

export async function sendContactEmail(submission: ContactSubmission): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    // CONTACT_SMTP_USER doubles as the visible From identity. It must be
    // provisioned as a distinct, sender-login-mapped submission account —
    // never TO_ADDRESS's own credential — or this both defeats the
    // credential isolation the submission user exists for and reintroduces
    // a from == to self-send.
    from: `branchLeft website <${process.env.CONTACT_SMTP_USER}>`,
    to: TO_ADDRESS,
    replyTo: submission.email,
    subject: `🔔 Website enquiry: ${submission.category}`,
    text: buildText(submission),
    html: buildHtml(submission),
  });
}
