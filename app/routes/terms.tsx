import * as React from 'react';
import { SectionHeading } from '@branchleft/components';
import { buildMeta } from '../lib/meta';

export function meta() {
  return buildMeta({
    title: 'Terms — branchLeft',
    description: 'Terms of use for the branchleft.co.uk website.',
    path: '/terms',
  });
}

export default function Terms(): React.JSX.Element {
  return (
    <main className="long-form legal-page">
      <header>
        <h1>Website Terms of Use</h1>
        <p className="eyebrow legal-page__meta">Effective: 29 July 2026</p>
        <p>
          These terms govern your use of <strong>branchleft.co.uk</strong>. They do{' '}
          <strong>not</strong> govern any professional services provided by branchLeft; those are
          covered by a separate written agreement signed by both parties.
        </p>
      </header>

      <section aria-labelledby="who-we-are">
        <SectionHeading as="h2" anchor="who-we-are">
          Who we are
        </SectionHeading>
        <p>
          This site is operated by BRANCHLEFT LTD, a company registered in England & Wales (company
          number 17355203), registered office 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ.
          Contact: <a href="mailto:contact@branchleft.co.uk">contact@branchleft.co.uk</a>.
        </p>
      </section>

      <section aria-labelledby="informational">
        <SectionHeading as="h2" anchor="informational">
          Informational only
        </SectionHeading>
        <p>
          Everything on this website — including descriptions of services, case studies, opinions,
          and any technical or commercial commentary — is provided for general information only. It
          is not professional, legal, or financial advice and must not be relied on as such.
        </p>
      </section>

      <section aria-labelledby="no-relationship">
        <SectionHeading as="h2" anchor="no-relationship">
          No client relationship
        </SectionHeading>
        <p>
          Browsing this site, submitting the contact form, or exchanging emails with us does not
          create a contract, retainer, or client relationship. Any engagement with branchLeft begins
          only when both parties sign a written agreement (for example, a Master Services Agreement
          or Statement of Work) covering the specific scope, fees, and terms.
        </p>
      </section>

      <section aria-labelledby="ip">
        <SectionHeading as="h2" anchor="ip">
          Intellectual property
        </SectionHeading>
        <p>
          All content on this website — text, code, layout, graphics, and the branchLeft name and
          logo — is owned by BRANCHLEFT LTD or its licensors and is protected by UK and
          international law. You may view and print pages for personal, non-commercial reference.
          Any other use — including copying, scraping (whether manually or by automated means),
          republication, or use to train machine-learning models — requires our prior written
          permission.
        </p>
      </section>

      <section aria-labelledby="acceptable-use">
        <SectionHeading as="h2" anchor="acceptable-use">
          Acceptable use
        </SectionHeading>
        <p>You agree not to:</p>
        <ul>
          <li>use the site in any way that breaches applicable law;</li>
          <li>attempt to gain unauthorised access to the site or its underlying systems;</li>
          <li>
            transmit material intended to disrupt the site (viruses, denial-of-service traffic, or
            automated requests at a volume that degrades service for others);
          </li>
          <li>use the contact form to send spam, harassment, or unlawful content.</li>
        </ul>
      </section>

      <section aria-labelledby="third-party-links">
        <SectionHeading as="h2" anchor="third-party-links">
          Third-party links
        </SectionHeading>
        <p>
          This site may link to third-party websites (for example, source repositories or published
          articles). Those sites are outside our control and we accept no responsibility for their
          content, availability, or privacy practices.
        </p>
      </section>

      <section aria-labelledby="as-is">
        <SectionHeading as="h2" anchor="as-is">
          Provided &ldquo;as is&rdquo;
        </SectionHeading>
        <p>
          The website is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To
          the fullest extent permitted by law we make no warranties, express or implied, that the
          site will be uninterrupted, error-free, secure, or that any information on it is accurate,
          complete, or current.
        </p>
      </section>

      <section aria-labelledby="liability">
        <SectionHeading as="h2" anchor="liability">
          Limitation of liability
        </SectionHeading>
        <p>
          Nothing in these terms limits or excludes our liability for (a) death or personal injury
          caused by our negligence, (b) fraud or fraudulent misrepresentation, or (c) any liability
          that cannot be limited or excluded under English law — including your statutory rights as
          a consumer under the Consumer Rights Act 2015.
        </p>
        <p>Subject to that, and to the fullest extent permitted by law:</p>
        <ul>
          <li>
            we accept no liability for any loss or damage arising out of, or in connection with,
            your use of this website;
          </li>
          <li>
            we specifically disclaim any indirect, consequential, or special loss, and any loss of
            profits, revenue, business, data, goodwill, or opportunity;
          </li>
          <li>
            our total aggregate liability to any visitor in connection with the website is limited
            to <strong>£1</strong>. You do not pay us to access the site, and this cap reflects
            that.
          </li>
        </ul>
      </section>

      <section aria-labelledby="privacy">
        <SectionHeading as="h2" anchor="privacy">
          Privacy
        </SectionHeading>
        <p>
          Your use of the site is also governed by our <a href="/privacy">Privacy Notice</a>.
        </p>
      </section>

      <section aria-labelledby="changes">
        <SectionHeading as="h2" anchor="changes">
          Changes to these terms
        </SectionHeading>
        <p>
          We may update these terms from time to time. The current version and its effective date
          are shown above. Continued use of the site after a change constitutes acceptance of the
          updated terms.
        </p>
      </section>

      <section aria-labelledby="governing-law">
        <SectionHeading as="h2" anchor="governing-law">
          Governing law and jurisdiction
        </SectionHeading>
        <p>
          These terms and any dispute arising out of or in connection with them are governed by the
          laws of England and Wales. The courts of England and Wales have exclusive jurisdiction,
          save that if you are a consumer resident in another part of the UK you may also bring
          proceedings in the courts of that part of the UK.
        </p>
      </section>
    </main>
  );
}
