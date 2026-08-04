import * as React from 'react';
import { Link } from 'react-router';
import { Palette, Star, Server, Code, Plus } from 'lucide-react';
import { AccordionItem, SectionHeading } from '@branchleft/components';
import { buildMeta } from '../lib/meta';

export function meta() {
  return buildMeta({
    title: 'Affordable Websites — branchLeft',
    description:
      'Websites built and hosted at-cost for eligible UK-based entities working in the public interest: charities, CIOs, CICs, community benefit societies, co-operatives and worker-owned businesses.',
    path: '/solutions/affordable-websites',
  });
}

export default function AffordableWebsites(): React.JSX.Element {
  // Any number of feature groups can be open at once — unlike a
  // one-open-at-a-time accordion, nothing here enforces exclusivity.
  const [openFeatureGroups, setOpenFeatureGroups] = React.useState<ReadonlySet<string>>(
    () => new Set(['design'])
  );

  function setFeatureGroupOpen(id: string, open: boolean) {
    setOpenFeatureGroups((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <main className="long-form article-page">
      <Link to="/about#solutions" className="directional-link back-link">
        <span className="directional-link__arrow" aria-hidden="true">
          ←
        </span>
        <span>Back</span>
      </Link>
      <SectionHeading as="h1" anchor="affordable-websites">
        Affordable Websites
      </SectionHeading>

      <section className="article-page__section" aria-labelledby="affordable-websites">
        <p>
          Every organisation needs a website, but not all organisations have deep pockets,
          especially those doing work that benefits people & planet. You shouldn't be left choosing
          between spending money that should go towards your work and settling for a site that
          undersells what you do.
        </p>
        <p>
          With us, that trade-off is not one you need to make. Our mission is to lower the barrier
          of entry for great tech, and that's why we deliver this solution at-cost for eligible
          UK-based entities working in the public interest.
        </p>
      </section>

      <section className="article-page__section" aria-labelledby="who-this-is-for">
        <SectionHeading as="h2" anchor="who-this-is-for">
          Who This Is For
        </SectionHeading>
        <p>This solution is available at our reduced rates to:</p>
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

      <section className="article-page__section" aria-labelledby="for-profit-companies">
        <SectionHeading as="h2" anchor="for-profit-companies">
          For-Profit Companies
        </SectionHeading>
        <p>
          We also take on work for for-profit companies, at higher rates across build, hosting and
          support, bringing our pricing closer in line with the wider market.
        </p>
        <p>
          Those higher rates help subsidise the public interest work above: working with us as a
          for-profit company means part of what you pay goes towards charities, co-operatives and
          the rest of our mission-led client base. It's a similar principle to the discounted
          non-profit pricing long offered by major software providers, such as Microsoft 365
          Nonprofit and Salesforce.org.
        </p>
      </section>

      <section className="article-page__section" aria-labelledby="what-we-build">
        <SectionHeading as="h2" anchor="what-we-build">
          What We Build
        </SectionHeading>
        <p>
          Affordable pricing doesn't mean a lesser product. Every site we build is engineered to an
          exceptionally high standard.
        </p>
        <AccordionItem
          className="article-page__feature-group"
          data-accent="design"
          open={openFeatureGroups.has('design')}
          onOpenChange={(open) => setFeatureGroupOpen('design', open)}
          summary={
            <span className="article-page__feature-summary-label">
              <Palette className="article-page__feature-icon" aria-hidden="true" />
              <SectionHeading as="h3">Design & Development</SectionHeading>
            </span>
          }
        >
          <ul>
            <li>
              a complete design service, covering all functional and visual aspects of your site
            </li>
            <li>bring-your-own-brand, or see our branding add-on below</li>
            <li>
              Strapi, an open source CMS, integrated as standard so you can log in and edit your own
              content
            </li>
            <li>bespoke integrations where your needs go beyond a standard build</li>
          </ul>
        </AccordionItem>
        <AccordionItem
          className="article-page__feature-group"
          data-accent="quality"
          open={openFeatureGroups.has('quality')}
          onOpenChange={(open) => setFeatureGroupOpen('quality', open)}
          summary={
            <span className="article-page__feature-summary-label">
              <Star className="article-page__feature-icon" aria-hidden="true" />
              <SectionHeading as="h3">Quality & Accessibility</SectionHeading>
            </span>
          }
        >
          <ul>
            <li>built to WCAG AAA, the highest level of accessibility compliance</li>
            <li>fully responsive, tested across every screen size from phone to widescreen</li>
            <li>comprehensive automated and manual testing before every release</li>
            <li>
              a modern, actively maintained stack, built with progressive enhancement so your site
              still works before JavaScript loads
            </li>
          </ul>
        </AccordionItem>
        <AccordionItem
          className="article-page__feature-group"
          data-accent="hosting"
          open={openFeatureGroups.has('hosting')}
          onOpenChange={(open) => setFeatureGroupOpen('hosting', open)}
          summary={
            <span className="article-page__feature-summary-label">
              <Server className="article-page__feature-icon" aria-hidden="true" />
              <SectionHeading as="h3">Hosting & Cost</SectionHeading>
            </span>
          }
        >
          <ul>
            <li>builds start from £500, scaling with the size of your project</li>
            <li>hosting starts from £10/month, scaling with traffic</li>
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
        </AccordionItem>
        <AccordionItem
          className="article-page__feature-group"
          data-accent="ownership"
          open={openFeatureGroups.has('ownership')}
          onOpenChange={(open) => setFeatureGroupOpen('ownership', open)}
          summary={
            <span className="article-page__feature-summary-label">
              <Code className="article-page__feature-icon" aria-hidden="true" />
              <SectionHeading as="h3">Ownership</SectionHeading>
            </span>
          }
        >
          <ul>
            <li>open source by default, so you're never locked into us</li>
            <li>your content, your domain, your data</li>
            <li>
              documentation clear enough that another developer could pick up where we left off
            </li>
          </ul>
        </AccordionItem>
        <AccordionItem
          className="article-page__feature-group"
          data-accent="addons"
          open={openFeatureGroups.has('addons')}
          onOpenChange={(open) => setFeatureGroupOpen('addons', open)}
          summary={
            <span className="article-page__feature-summary-label">
              <Plus className="article-page__feature-icon" aria-hidden="true" />
              <SectionHeading as="h3">Add-ons</SectionHeading>
            </span>
          }
        >
          <ul>
            <li>optional content copywriting, so your message lands as clearly as your design</li>
            <li>
              a full branding consultation: a bespoke logo and complete visual theme (colours,
              typeface, and so on) that together form a consistent language for your brand and are
              yours to keep and reuse across all your organisation's content, not just your site.
            </li>
          </ul>
        </AccordionItem>
      </section>

      <section className="article-page__section" aria-labelledby="our-process">
        <SectionHeading as="h2" anchor="our-process">
          Our Process
        </SectionHeading>
        <ol className="article-page__process">
          <li className="article-page__process-step">
            <span className="article-page__process-index" aria-hidden="true">
              1
            </span>
            <p>
              a design consultation and wireframe or proof-of-concept, at a low fixed fee, credited
              against your final invoice if you go ahead
            </p>
          </li>
          <li className="article-page__process-step">
            <span className="article-page__process-index" aria-hidden="true">
              2
            </span>
            <p>
              the build itself, priced at-cost once you've approved the direction, and with a tight
              feedback loop to keep us on-track
            </p>
          </li>
          <li className="article-page__process-step">
            <span className="article-page__process-index" aria-hidden="true">
              3
            </span>
            <p>
              handover, with documentation and access to everything, so you're never dependent on us
              to keep going
            </p>
          </li>
        </ol>
      </section>

      <section className="article-page__section" aria-labelledby="work-with-us">
        <SectionHeading as="h2" anchor="work-with-us">
          Work With Us
        </SectionHeading>
        <div className="article-page__callout">
          <p className="article-page__callout-label">Eligible and ready to start?</p>
          <p>
            If you're a charity, CIO, CIC, community benefit society, co-operative or worker-owned
            business looking for an affordable website, get in touch via our{' '}
            <Link to="/contact?category=affordable-websites">contact form</Link>. If our starting
            prices still aren't viable for you, get in touch anyway — we may be able to find a
            suitable arrangement.
          </p>
        </div>
        <div className="article-page__callout">
          <p className="article-page__callout-label">A for-profit company?</p>
          <p>
            We'd still love to work with you, at our adjusted rates. Get in touch via our{' '}
            <Link to="/contact?category=affordable-websites">contact form</Link> and we'll get
            started.
          </p>
        </div>
      </section>
    </main>
  );
}
