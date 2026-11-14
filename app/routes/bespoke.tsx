import * as React from 'react';
import { Link } from 'react-router';
import { NextSteps } from '../components/Avenues';
import { buildMeta } from '../lib/meta';

export function meta() {
  return buildMeta({
    title: 'Bespoke Solutions — branchLeft',
    description:
      'Bespoke technology, and websites built and hosted at-cost for eligible UK-based entities working in the public interest.',
    path: '/bespoke',
  });
}

/*
 * Every sentence here is carried over from the former About "Solutions"
 * panel and the former Affordable Websites page, shortened to the parts a
 * reader needs to decide whether to get in touch.
 */
export default function Bespoke(): React.JSX.Element {
  return (
    <main className="landing" data-avenue="bespoke">
      <header className="landing-hero">
        <p className="eyebrow">Bespoke Solutions</p>
        <h1>What technology do you want to build to change the world for the better?</h1>
        <p className="landing-hero__lede">
          Leveraging our expertise, we can bring anything from the simplest to the most ambitious
          vision to life.
        </p>
        <ul className="landing-hero__actions">
          <li>
            <Link className="button" to="/contact?category=bespoke-technology">
              tell us more
            </Link>
          </li>
        </ul>
      </header>

      <section className="landing-section" id="affordable-websites" aria-labelledby="websites">
        <h2 id="websites">Affordable Websites</h2>
        <div className="landing-columns">
          <p>
            Every organisation needs a website, but not all organisations have deep pockets,
            especially those doing work that benefits people & planet. You shouldn&rsquo;t be left
            choosing between spending money that should go towards your work and settling for a site
            that undersells what you do.
          </p>
          <p>
            With us, that trade-off is not one you need to make. Our mission is to lower the barrier
            of entry for great tech, and that&rsquo;s why we deliver this solution at-cost for
            eligible UK-based entities working in the public interest.
          </p>
        </div>

        <ul className="landing-facts">
          <li>builds start from £500, scaling with the size of your project</li>
          <li>hosting starts from £10/month, scaling with traffic</li>
        </ul>

        <div className="landing-columns">
          <div>
            <h3>Who This Is For</h3>
            <ul>
              <li>registered charities</li>
              <li>Charitable Incorporated Organisations (CIOs)</li>
              <li>Community Interest Companies (CICs)</li>
              <li>community benefit societies</li>
              <li>co-operative and mutual societies</li>
              <li>worker-owned businesses</li>
            </ul>
          </div>
          <div>
            <h3>Our Process</h3>
            <ol>
              <li>
                a design consultation and wireframe or proof-of-concept, at a low fixed fee,
                credited against your final invoice if you go ahead
              </li>
              <li>
                the build itself, priced at-cost once you&rsquo;ve approved the direction, and with
                a tight feedback loop to keep us on-track
              </li>
              <li>
                handover, with documentation and access to everything, so you&rsquo;re never
                dependent on us to keep going
              </li>
              <li>a discussion of support arrangements tailored to your needs</li>
            </ol>
          </div>
        </div>

        <div className="landing-columns">
          <aside className="callout" aria-labelledby="eligible">
            <p className="eyebrow" id="eligible">
              Eligible and ready to start?
            </p>
            <p>
              If you&rsquo;re a charity, CIO, CIC, community benefit society, co-operative or
              worker-owned business looking for an affordable website, get in touch via our{' '}
              <Link to="/contact?category=affordable-websites">contact form</Link>. If our starting
              prices still aren&rsquo;t viable for you, get in touch anyway — we may be able to find
              a suitable arrangement.
            </p>
          </aside>
          <aside className="callout" aria-labelledby="for-profit">
            <p className="eyebrow" id="for-profit">
              A for-profit company?
            </p>
            <p>
              We&rsquo;d still love to work with you, at our adjusted rates. Get in touch via our{' '}
              <Link to="/contact?category=affordable-websites">contact form</Link> and we&rsquo;ll
              get started.
            </p>
          </aside>
        </div>
      </section>

      <NextSteps current="/bespoke" />
    </main>
  );
}
