import nodemailer from 'nodemailer';

export type ContactSubmission = {
  readonly category: string;
  readonly email: string;
  readonly message: string;
};

const TO_ADDRESS = 'info@branchleft.co.uk';

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
  return nodemailer.createTransport({
    host,
    port: Number(port),
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
    <div style="font-family: Helvetica, Arial, sans-serif; background: #000000; color: #ffffff; padding: 24px; max-width: 560px; margin: 0 auto;">
      <div style="border-bottom: 3px solid #b31761; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: bold; letter-spacing: 0.02em;">branch<span style="color: #ff006e;">Left</span></span>
        <div style="color: #b31761; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px;">New website enquiry</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="color: #b31761; font-size: 13px; padding: 4px 12px 4px 0; vertical-align: top; white-space: nowrap;">Category</td>
          <td style="font-size: 14px; padding: 4px 0;">${category}</td>
        </tr>
        <tr>
          <td style="color: #b31761; font-size: 13px; padding: 4px 12px 4px 0; vertical-align: top; white-space: nowrap;">From</td>
          <td style="font-size: 14px; padding: 4px 0;"><a href="mailto:${email}" style="color: #ff006e;">${email}</a></td>
        </tr>
      </table>
      <div style="border-top: 1px solid #333333; padding-top: 16px; font-size: 14px; line-height: 1.6;">
        ${message}
      </div>
      <div style="border-top: 1px solid #333333; margin-top: 20px; padding-top: 12px; font-size: 12px; color: #999999;">
        Reply-To is already set to the sender — hit reply to respond directly.
      </div>
    </div>
  `;
}

export async function sendContactEmail(submission: ContactSubmission): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from: `branchLeft website <${process.env.CONTACT_SMTP_USER}>`,
    to: TO_ADDRESS,
    replyTo: submission.email,
    subject: `🔔 Website enquiry: ${submission.category}`,
    text: buildText(submission),
    html: buildHtml(submission),
  });
}
