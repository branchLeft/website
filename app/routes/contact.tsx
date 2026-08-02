import * as React from 'react';
import { Form, useActionData, useNavigation, useSearchParams } from 'react-router';
import type { Route } from './+types/contact';
import { sendContactEmail } from '../lib/sendContactEmail.server';

/**
 * Abuse protection: length caps, a honeypot + minimum time-on-page check,
 * and a per-IP rate limit (in-memory, per Cloud Run instance — see
 * isRateLimited below).
 */

export function meta() {
  return [
    { title: 'Contact — branchLeft' },
    { name: 'description', content: 'Contact branchLeft' },
  ];
}

/**
 * Known category slugs — kept as a readonly tuple so we can both:
 *   - render the dropdown options from a single source, and
 *   - whitelist an inbound `?category=` query param before applying it as
 *     the default selection (guards against arbitrary/malicious values).
 */
const CATEGORIES = [
  { value: 'local-news', label: 'Local News & Independent Media' },
  { value: 'affordable-websites', label: 'Affordable Websites' },
  { value: 'bespoke-technology', label: 'Bespoke Technology' },
  { value: 'general', label: 'General Enquiry' },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]['value'];

const CATEGORY_VALUES: readonly CategoryValue[] = CATEGORIES.map((c) => c.value);

export function isKnownCategory(value: string | null): value is CategoryValue {
  return value !== null && (CATEGORY_VALUES as readonly string[]).includes(value);
}

const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,24}$/;

const MESSAGE_MIN_LENGTH = 30;
// Hard caps so a submission can't carry an arbitrarily large body into the
// SMTP send. 254 is the practical maximum length of a valid email address;
// 5,000 characters is generous for a contact enquiry.
export const EMAIL_MAX_LENGTH = 254;
export const MESSAGE_MAX_LENGTH = 5000;

// Honeypot: a field real users never see or reach (aria-hidden, removed
// from tab order, visually hidden off-screen — see contact.css). Its name
// and label deliberately don't say "honeypot" anywhere client-visible;
// that word is a common bot-side blocklist keyword.
export const HONEYPOT_FIELD_NAME = 'company';

// Minimum time between the page rendering (stamped by `loader` below as
// `renderedAt`) and the form posting. Real users need at least this long to
// read the form and type >= MESSAGE_MIN_LENGTH characters; scripted
// submissions that post immediately after fetching the page do not.
export const MIN_SUBMIT_DELAY_MS = 1500;

// Per-IP submission rate limit. Deliberately simple and in-memory (a `Map`
// with timestamps, pruned lazily) rather than a new infra dependency like
// Redis. See the module-level comment above for the multi-instance caveat.
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT_MAX_SUBMISSIONS = 5;

const submissionsByIp = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

/** Records a submission attempt for `ip` and reports whether it's over the
 * rate limit. Also opportunistically prunes stale IPs so the map doesn't
 * grow unboundedly over the lifetime of the instance. */
function isRateLimited(ip: string, now: number): boolean {
  const recent = (submissionsByIp.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  submissionsByIp.set(ip, recent);

  if (submissionsByIp.size > 500) {
    for (const [key, timestamps] of submissionsByIp) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)) {
        submissionsByIp.delete(key);
      }
    }
  }

  return recent.length > RATE_LIMIT_MAX_SUBMISSIONS;
}

type ActionResult =
  { readonly ok: true } | { readonly ok: false; readonly error: string | React.JSX.Element };

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function loader(): Promise<{ renderedAt: number }> {
  return { renderedAt: Date.now() };
}

export async function action({ request }: Route.ActionArgs): Promise<ActionResult> {
  const now = Date.now();
  const clientIp = getClientIp(request);

  if (isRateLimited(clientIp, now)) {
    return {
      ok: false,
      error: 'Too many submissions from this network. Please try again in a few minutes.',
    };
  }

  const formData = await request.formData();
  const category = formString(formData, 'category');
  const email = formString(formData, 'email');
  const message = formString(formData, 'message');
  const honeypot = formString(formData, HONEYPOT_FIELD_NAME);
  const renderedAt = Number(formString(formData, 'renderedAt'));

  // Bot signals: the honeypot got filled, or the form posted faster than a
  // human could fill it. Pretend success either way, so scripted clients
  // get no signal to adapt to.
  if (honeypot !== '' || !Number.isFinite(renderedAt) || now - renderedAt < MIN_SUBMIT_DELAY_MS) {
    return { ok: true };
  }

  if (!isKnownCategory(category)) {
    return { ok: false, error: 'Please select a valid category.' };
  }
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (message.trim().length < MESSAGE_MIN_LENGTH) {
    return { ok: false, error: 'Please provide a bit more detail in your message.' };
  }
  if (message.length > MESSAGE_MAX_LENGTH) {
    return { ok: false, error: 'Please keep your message under 5,000 characters.' };
  }

  try {
    await sendContactEmail({ category, email, message });
  } catch (error) {
    console.error('Failed to send contact form email:', error);
    return {
      ok: false,
      error: (
        <>
          Something went wrong sending your message. Please try again or email us directly at{' '}
          <a href="mailto:info@branchleft.co.uk">info@branchleft.co.uk</a>.
        </>
      ),
    };
  }

  return { ok: true };
}

export default function Contact({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const rawCategory = searchParams.get('category');
  const initialCategory: CategoryValue | '' = isKnownCategory(rawCategory) ? rawCategory : '';

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';

  return (
    <main className="page-shell">
      <h1>Contact Us</h1>
      {actionData?.ok === true ? (
        <output className="contact-form__status contact-form__status--success">
          Thanks — your message has been sent. We'll get back to you soon.
        </output>
      ) : (
        <Form className="contact-form" method="post">
          <input type="hidden" name="renderedAt" value={loaderData.renderedAt} />
          {/* Honeypot: hidden from sighted users (off-screen CSS) and from
              assistive tech (aria-hidden + tabIndex={-1}). Only a bot
              filling every field in the raw HTML will ever populate this. */}
          <div className="contact-form__field contact-form__field--alt" aria-hidden="true">
            <label className="eyebrow contact-form__label" htmlFor="company">
              Company
            </label>
            <input
              className="contact-form__input"
              id="company"
              type="text"
              name={HONEYPOT_FIELD_NAME}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <div className="contact-form__field">
            <label className="eyebrow contact-form__label" htmlFor="category">
              Category
            </label>
            <select
              className="contact-form__select"
              id="category"
              name="category"
              defaultValue={initialCategory}
              required
            >
              <option value="" disabled>
                Select a category…
              </option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="contact-form__field">
            <label className="eyebrow contact-form__label" htmlFor="email">
              Email
            </label>
            <input
              className="contact-form__input"
              id="email"
              type="email"
              name="email"
              maxLength={EMAIL_MAX_LENGTH}
              required
            />
          </div>
          <div className="contact-form__field">
            <label className="eyebrow contact-form__label" htmlFor="message">
              Message
            </label>
            <textarea
              className="contact-form__textarea"
              id="message"
              name="message"
              minLength={MESSAGE_MIN_LENGTH}
              maxLength={MESSAGE_MAX_LENGTH}
              required
            />
          </div>
          {actionData?.ok === false && (
            <p className="contact-form__status contact-form__status--error" role="alert">
              {actionData.error}
            </p>
          )}
          <button className="eyebrow contact-form__submit" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </Form>
      )}
    </main>
  );
}
