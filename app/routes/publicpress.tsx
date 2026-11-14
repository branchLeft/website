import * as React from 'react';
import { Link } from 'react-router';
import { PublicPressLogo } from '@branchleft/brand-publicpress';
import { NextSteps } from '../components/Avenues';
import { buildMeta } from '../lib/meta';

export function meta() {
  return buildMeta({
    title: 'Announcing PublicPress — branchLeft',
    description:
      'PublicPress: managed technical solutions for independent newsrooms in the UK, from a company that exists to support them.',
    path: '/publicpress',
  });
}

const PUBLICPRESS_URL = 'https://publicpress.co.uk/';

/*
 * The headline, lede and launch line are PublicPress's approved launch copy
 * (publicpress.co.uk); the "why" is the opening of the former Local News
 * page.
 */
export default function PublicPress(): React.JSX.Element {
  return (
    <main className="landing" data-avenue="publicpress">
      <header className="landing-hero">
        <h1 className="publicpress-title">
          {/* The span sets the size; the logo fills its height. */}
          <span className="publicpress-title__mark">
            <PublicPressLogo decorative height="100%" />
          </span>
          PublicPress
        </h1>
        <p className="landing-hero__headline">
          Independent journalism, on independent infrastructure.
        </p>
        <p className="landing-hero__lede">
          Your Ghost site, without compromise. Managed technical solutions for independent newsrooms
          in the UK, from a company that exists to support them.
        </p>
        <p className="landing-hero__fact">Launching by 1st March 2027</p>
        <ul className="landing-hero__actions">
          <li>
            <a className="button" href={PUBLICPRESS_URL}>
              learn more <span aria-hidden="true">→</span>
            </a>
          </li>
        </ul>
      </header>

      <section className="landing-section" aria-labelledby="why">
        <h2 id="why">Why we are doing this</h2>
        <div className="landing-prose">
          <p>
            Local news reporting in the public interest is more important than ever. Not too long
            ago, local newspapers and radio stations were the lifeblood of communities, providing
            residents with information about local events, politics, and issues that directly
            affected their lives.
          </p>
          <p>
            The intentional corporate consolidation of media by conglomerates, big tech and their
            billionaire-class backers has led to &ldquo;news deserts&rdquo; in many communities
            where local news has not survived. Local issues go unreported and residents are left
            uninformed.
          </p>
        </div>
      </section>

      <aside className="callout" aria-labelledby="established">
        <p className="eyebrow" id="established">
          Already well-established?
        </p>
        <p>
          If you&rsquo;re already well-established and Ghost isn&rsquo;t the right fit for you,
          please get in touch via our{' '}
          <Link to="/contact?category=bespoke-technology">contact form</Link> and we&rsquo;ll
          discuss how we can help you build a bespoke solution.
        </p>
      </aside>

      <NextSteps current="/publicpress" />
    </main>
  );
}
