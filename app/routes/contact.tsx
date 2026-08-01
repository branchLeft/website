import * as React from 'react';
import { Form, useActionData, useNavigation, useSearchParams } from 'react-router';
import type { Route } from './+types/contact';
import { sendContactEmail } from '../lib/sendContactEmail.server';

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

type ActionResult =
  { readonly ok: true } | { readonly ok: false; readonly error: string | React.JSX.Element };

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function action({ request }: Route.ActionArgs): Promise<ActionResult> {
  const formData = await request.formData();
  const category = formString(formData, 'category');
  const email = formString(formData, 'email');
  const message = formString(formData, 'message');

  if (!isKnownCategory(category)) {
    return { ok: false, error: 'Please select a valid category.' };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (message.trim().length < MESSAGE_MIN_LENGTH) {
    return { ok: false, error: 'Please provide a bit more detail in your message.' };
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

export default function Contact() {
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
            <input className="contact-form__input" id="email" type="email" name="email" required />
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
