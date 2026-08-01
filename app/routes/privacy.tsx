import * as React from 'react';

export function meta() {
  return [
    { title: 'Privacy — branchLeft' },
    { name: 'description', content: 'BRANCHLEFT LTD privacy notice.' },
  ];
}

export default function Privacy(): React.JSX.Element {
  return (
    <main className="long-form legal-page">
      <header>
        <h1>Privacy Notice</h1>
        <p className="eyebrow legal-page__meta">
          Effective: 29 July 2026 · Last updated: 29 July 2026
        </p>
      </header>

      <section aria-labelledby="who-we-are">
        <h2 id="who-we-are">Who we are</h2>
        <p>
          BRANCHLEFT LTD (&ldquo;branchLeft&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a company
          registered in England &amp; Wales (company number 17355203). Our registered office is
          71-75 Shelton Street, Covent Garden, London, WC2H 9JQ.
        </p>
        <p>
          We are the data controller for the personal information described in this notice. We are
          registered with the Information Commissioner&rsquo;s Office under registration number
          ZC207801.
        </p>
      </section>

      <section aria-labelledby="contact">
        <h2 id="contact">Contact</h2>
        <p>
          For any question about this notice or your personal information, email{' '}
          <a href="mailto:contact@branchleft.co.uk">contact@branchleft.co.uk</a>.
        </p>
      </section>

      <section aria-labelledby="what-we-collect">
        <h2 id="what-we-collect">What information we collect and why</h2>
        <p>
          The website has one interactive feature: a contact form. We collect only the information
          you choose to submit through that form, together with a minimal amount of technical
          information necessary to deliver the site.
        </p>
        <h3>Enquiries submitted through the contact form</h3>
        <ul>
          <li>Your name</li>
          <li>Your email address</li>
          <li>The category of enquiry you select</li>
          <li>The content of your message</li>
        </ul>
        <p>
          We use this information to read your enquiry, reply to you, and (if the conversation leads
          to work) to enter into and perform a contract with you.
        </p>
        <h3>Delivering services to clients</h3>
        <p>
          Where an enquiry becomes an engagement, we hold ordinary business-contact information
          (name, work email, phone, correspondence, and records of meetings and decisions) for the
          duration of the engagement and afterwards as required to meet our legal obligations.
        </p>
        <h3>Legal obligations</h3>
        <p>
          We keep records required by UK tax and company law (for example, invoices and contract
          records for HMRC).
        </p>
        <h3>Technical information</h3>
        <p>
          Our host may automatically log basic request metadata (IP address, user-agent, timestamp)
          for security and abuse prevention. We do not use this data to identify you and we do not
          build behavioural profiles.
        </p>
        <p>
          <strong>We do not use cookies or analytics on this website.</strong> No non-essential
          cookies are set. We do not track visitors across sites, and we do not use automated
          decision-making or profiling.
        </p>
      </section>

      <section aria-labelledby="lawful-bases">
        <h2 id="lawful-bases">Lawful bases</h2>
        <p>
          Under the UK GDPR we must have a &ldquo;lawful basis&rdquo; for collecting and using
          personal information. The bases we rely on are:
        </p>
        <ul>
          <li>
            <strong>Consent</strong> — where you submit information through the contact form, you
            are consenting to us using that information to respond to you. You can withdraw consent
            at any time by emailing us.
          </li>
          <li>
            <strong>Contract</strong> — where we need to process your information to enter into or
            perform a contract for services with you.
          </li>
          <li>
            <strong>Legal obligation</strong> — where we must keep records to comply with UK tax,
            company or other law.
          </li>
          <li>
            <strong>Legitimate interests</strong> — for basic server logs used to keep the site
            secure and available. Our interest in a working, secure site is balanced against your
            privacy; you can object at any time.
          </li>
        </ul>
      </section>

      <section aria-labelledby="sources">
        <h2 id="sources">Where we get personal information from</h2>
        <ul>
          <li>Directly from you (via the contact form or subsequent correspondence).</li>
          <li>
            Occasionally from publicly available sources (for example, a company&rsquo;s public
            website) when preparing to reply to an enquiry.
          </li>
        </ul>
      </section>

      <section aria-labelledby="processors">
        <h2 id="processors">Who we share it with</h2>
        <p>We do not sell personal information. We share it only with:</p>
        <ul>
          <li>
            <strong>Google (Google Workspace / Gmail)</strong> — hosts our{' '}
            <code>@branchleft.co.uk</code> email inboxes and therefore processes the content of any
            email correspondence with us, including messages submitted through our contact form.
            Google is a US company; transfers of personal data to Google are covered by the UK
            extension to the EU-US Data Privacy Framework and/or the UK International Data Transfer
            Addendum.
          </li>
          <li>
            <strong>Google Cloud Platform (GCP)</strong> — hosts this website. Where possible we
            serve from UK/EEA regions; where processing occurs outside the UK it is covered by the
            safeguards above.
          </li>
          <li>
            <strong>IONOS</strong> — our domain registrar. IONOS processes only the registration
            information required to operate the <code>branchleft.co.uk</code> domain, not the
            content of enquiries.
          </li>
          <li>
            Professional advisors (for example, accountants) and authorities where we are required
            to disclose information by law.
          </li>
        </ul>
        <p>
          The contact form does not currently submit anywhere — it is a no-op until a form processor
          is chosen. This section will be updated when that changes.
        </p>
      </section>

      <section aria-labelledby="retention">
        <h2 id="retention">How long we keep information</h2>
        <table className="legal-page__table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Retention period</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Contact-form enquiries that do not lead to work</td>
              <td>24 months from last contact, then deleted</td>
            </tr>
            <tr>
              <td>Client engagement records (contracts, correspondence)</td>
              <td>7 years after the end of the engagement (HMRC statutory minimum)</td>
            </tr>
            <tr>
              <td>Financial records (invoices, payments)</td>
              <td>7 years after the end of the tax year</td>
            </tr>
            <tr>
              <td>Marketing consent records (where applicable)</td>
              <td>Until consent is withdrawn, then a further 12 months for evidence</td>
            </tr>
            <tr>
              <td>Server access logs</td>
              <td>Up to 90 days</td>
            </tr>
          </tbody>
        </table>
        <p>
          When a retention period ends, we delete the information or, where deletion is not
          technically practical (for example, encrypted backups), we isolate it and delete it on the
          next scheduled purge.
        </p>
      </section>

      <section aria-labelledby="rights">
        <h2 id="rights">Your UK GDPR rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Ask for a copy of the personal information we hold about you (right of access).</li>
          <li>Ask us to correct information that is inaccurate or incomplete (rectification).</li>
          <li>Ask us to delete your personal information (erasure).</li>
          <li>Ask us to limit how we use your information (restriction of processing).</li>
          <li>Object to processing that we base on legitimate interests.</li>
          <li>Ask us to transfer your information to another organisation (data portability).</li>
          <li>Withdraw consent at any time where we rely on consent.</li>
        </ul>
        <p>
          To exercise any of these rights, email{' '}
          <a href="mailto:contact@branchleft.co.uk">contact@branchleft.co.uk</a>. We will respond
          within one month.
        </p>
        <p>
          You can read more about your rights on the ICO&rsquo;s website at{' '}
          <a href="https://ico.org.uk/for-the-public/" rel="noreferrer">
            ico.org.uk/for-the-public
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="complaints">
        <h2 id="complaints">How to complain</h2>
        <p>
          If you have a concern about how we&rsquo;ve used your personal information, please contact
          us first at <a href="mailto:complaints@branchleft.co.uk">complaints@branchleft.co.uk</a>{' '}
          so we have the opportunity to put things right.
        </p>
        <p>
          If you remain unhappy, you can complain to the Information Commissioner&rsquo;s Office:
        </p>
        <address>
          Information Commissioner&rsquo;s Office
          <br />
          Wycliffe House, Water Lane
          <br />
          Wilmslow, Cheshire SK9 5AF
          <br />
          Helpline: 0303 123 1113
          <br />
          <a href="https://ico.org.uk/make-a-complaint" rel="noreferrer">
            ico.org.uk/make-a-complaint
          </a>
        </address>
      </section>

      <section aria-labelledby="changes">
        <h2 id="changes">Changes to this notice</h2>
        <p>
          We will post any material change to this notice here, together with an updated effective
          date. Where a change materially affects how we use information you have already given us,
          we will contact you directly.
        </p>
      </section>
    </main>
  );
}
