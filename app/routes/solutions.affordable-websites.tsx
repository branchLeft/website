import * as React from 'react';
import { Link } from 'react-router';

export function meta() {
  return [
    { title: 'Affordable Websites — branchLeft' },
    {
      name: 'description',
      content:
        'Websites built and hosted at-cost for eligible UK-based entities working in the public interest: charities, CIOs, CICs, community benefit societies, co-operatives and worker-owned businesses.',
    },
  ];
}

export default function AffordableWebsites(): React.JSX.Element {
  return (
    <main className="long-form article-page">
      <Link to="/about#solutions" className="directional-link back-link">
        <span className="directional-link__arrow" aria-hidden="true">
          ←
        </span>
        <span>Back</span>
      </Link>
      <h1>Affordable Websites</h1>

      <section className="article-page__section">
        <p>
          Every organisation working in the public interest needs a website, but most agencies and
          dev shops price as if the mission doesn't matter. Charities, co-operatives and other
          mission-led organisations are often left choosing between spending money that should go
          towards their work, or settling for a site that undersells what they do.
        </p>
        <p>
          We think that's the wrong trade-off to force on anyone. Technology should lower the
          barrier to entry for people doing good, not raise it. That's why we deliver this solution
          at-cost for eligible UK-based entities working in the public interest.
        </p>
      </section>

      <section className="article-page__section">
        <h2>Who This Is For</h2>
        <p>This solution is available to:</p>
        <ul>
          <li>registered charities</li>
          <li>Charitable Incorporated Organisations (CIOs)</li>
          <li>Community Interest Companies (CICs)</li>
          <li>community benefit societies</li>
          <li>co-operative and mutual societies</li>
          <li>worker-owned businesses</li>
        </ul>
        <p>If you're not sure whether you qualify, get in touch and we'll work it out together.</p>
      </section>

      <section className="article-page__section">
        <h2>For-Profit Companies</h2>
        <p>
          We also take on work for for-profit companies. It comes with a 50% surcharge across build,
          hosting, maintenance and support, bringing our pricing closer in line with the wider
          market.
        </p>
        <p>
          That surcharge helps subsidise the public interest work above: working with us as a
          for-profit company means part of what you pay goes towards charities, co-operatives and
          the rest of our mission-led client base. It's a similar principle to how other companies,
          including Anthropic, price differently depending on the kind of client, such as discounted
          non-profit rates.
        </p>
      </section>

      <section className="article-page__section">
        <h2>What We Build</h2>
        <p>
          Affordable pricing doesn't mean a lesser product. Every site we build is engineered to a
          genuinely high standard.
        </p>
        <div className="article-page__feature-group">
          <h3>Design &amp; Development</h3>
          <ul>
            <li>
              a complete design service, covering layout, theme, colour palette, logo and branding
            </li>
            <li>
              Strapi, an open source CMS, integrated as standard so you can log in and edit your own
              content
            </li>
            <li>bespoke integrations where your needs go beyond a standard build</li>
          </ul>
        </div>
        <div className="article-page__feature-group">
          <h3>Quality &amp; Accessibility</h3>
          <ul>
            <li>built to WCAG AAA, the highest level of accessibility compliance</li>
            <li>fully responsive, tested across every screen size from phone to widescreen</li>
            <li>comprehensive automated and manual testing before every release</li>
            <li>
              a modern, actively maintained stack, built with progressive enhancement so your site
              still works before JavaScript loads
            </li>
          </ul>
        </div>
        <div className="article-page__feature-group">
          <h3>Hosting &amp; Cost</h3>
          <ul>
            <li>
              the build, and the hosting that goes with it, both delivered at-cost with no markup
            </li>
            <li>
              hosting sized to your site: affordable by default, right-sized if you're expecting
              high traffic
            </li>
            <li>carbon-neutral hosting, covered as part of our environmental commitments</li>
            <li>
              your monthly hosting fee includes standard maintenance: security patches and iterative
              improvements to the platform your site runs on
            </li>
            <li>
              anything beyond that, like new features or design changes, is separate support work,
              still charged at-cost
            </li>
          </ul>
        </div>
        <div className="article-page__feature-group">
          <h3>Ownership</h3>
          <ul>
            <li>open source by default, so you're never locked into us</li>
            <li>your content, your domain, your data</li>
            <li>
              documentation clear enough that another developer could pick up where we left off
            </li>
          </ul>
        </div>
        <div className="article-page__feature-group">
          <h3>Add-ons</h3>
          <ul>
            <li>
              optional content copywriting, so your message lands as clearly as your design, priced
              at-cost as part of your quote
            </li>
          </ul>
        </div>
      </section>

      <section className="article-page__section">
        <h2>Our Process</h2>
        <div className="article-page__feature-group">
          <ol>
            <li>
              a design consultation and wireframe or proof-of-concept, at a low fixed fee, credited
              against your final invoice if you go ahead
            </li>
            <li>the build itself, priced at-cost once you've approved the direction</li>
            <li>
              handover, with documentation and access to everything, so you're never dependent on us
              to keep going
            </li>
          </ol>
        </div>
      </section>

      <section className="article-page__section">
        <h2>Cost</h2>
        <p>
          These figures are indicative starting points, not a fixed quote; your actual cost depends
          on what you need. We've set them against typical UK market rates for comparison.
        </p>
        <div className="article-page__comparison">
          <div className="article-page__comparison-column">
            <h3>branchLeft, at-cost</h3>
            <ul>
              <li>build: from £500, scaling with the size of your project</li>
              <li>consultation &amp; wireframe: from £150, credited if you proceed</li>
              <li>hosting: from £10/month, scaling with traffic</li>
              <li>
                hosting includes standard maintenance: security patches and ongoing platform
                improvements
              </li>
              <li>additional support beyond that: from £40/hour</li>
            </ul>
          </div>
          <div className="article-page__comparison-column">
            <h3>Typical UK agency</h3>
            <ul>
              <li>build: £800–£5,000+</li>
              <li>hosting &amp; maintenance: £500–£1,500/year</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="article-page__section">
        <h2>Our Goal</h2>
        <p>
          We keep our costs low and our pricing fair because we don't answer to investors and don't
          need to extract a profit. When we build something reusable, we share it, so the work of
          building it once benefits every organisation we work with. Affordable is a consequence of
          how we're structured, not a compromise on what we deliver.
        </p>
      </section>

      <section className="article-page__section">
        <h2>Work With Us</h2>
        <div className="article-page__callout">
          <p className="article-page__callout-label">Eligible and ready to start?</p>
          <p>
            If you're a charity, CIO, CIC, community benefit society, co-operative or worker-owned
            business looking for an affordable website, get in touch via our{' '}
            <Link to="/contact?category=affordable-websites">contact form</Link>.
          </p>
        </div>
        <div className="article-page__callout">
          <p className="article-page__callout-label">A for-profit company?</p>
          <p>
            We'd still love to work with you, at the surcharged rate above. Get in touch via our{' '}
            <Link to="/contact?category=affordable-websites">contact form</Link> and we'll get
            started.
          </p>
        </div>
      </section>
    </main>
  );
}
