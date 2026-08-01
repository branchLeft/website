import nodemailer from 'nodemailer';

export type ContactSubmission = {
  readonly category: string;
  readonly email: string;
  readonly message: string;
};

const TO_ADDRESS = 'info@branchleft.co.uk';

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set to send contact form email.');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendContactEmail(submission: ContactSubmission): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from: `branchLeft website <${process.env.GMAIL_USER}>`,
    to: TO_ADDRESS,
    replyTo: submission.email,
    subject: `New contact form enquiry: ${submission.category}`,
    text: `Category: ${submission.category}\nFrom: ${submission.email}\n\n${submission.message}`,
  });
}
