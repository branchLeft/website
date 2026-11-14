import * as React from 'react';
import { Link } from 'react-router';
import { PublicPressWordmark } from '@branchleft/brand-publicpress';

export type Avenue = {
  readonly to: string;
  readonly title: string;
  readonly line: string;
  readonly accent: 'publicpress' | 'about' | 'bespoke';
  /** Renders the title as the PublicPress wordmark, which carries it as its accessible name. */
  readonly publicPressWordmark?: boolean;
};

/**
 * The three ways into the site, in the owner's order. The home page shows
 * them as cards; every avenue page ends with the other two (NextSteps). Each
 * line is existing site or launch copy.
 */
export const AVENUES: readonly Avenue[] = [
  {
    to: '/publicpress',
    title: 'PublicPress',
    line: 'Announcing our platform for local news & independent journalism',
    accent: 'publicpress',
    publicPressWordmark: true,
  },
  {
    to: '/about',
    title: 'About branchLeft',
    line: 'A 100% worker-owned UK company building technology for people & planet.',
    accent: 'about',
  },
  {
    to: '/bespoke',
    title: 'Bespoke Solutions',
    line: 'What technology do you want to build to change the world for the better?',
    accent: 'bespoke',
  },
];

function AvenueCard({
  avenue,
  headingLevel,
}: {
  readonly avenue: Avenue;
  readonly headingLevel: 'h2' | 'h3';
}): React.JSX.Element {
  const Heading = headingLevel;
  return (
    <li className="avenue" data-avenue={avenue.accent}>
      <Link className="avenue__link" to={avenue.to}>
        <Heading className="avenue__title">
          {avenue.publicPressWordmark === true ? (
            /* The span sets the size; the wordmark fills its height. */
            <span className="avenue__wordmark">
              <PublicPressWordmark title={avenue.title} height="100%" />
            </span>
          ) : (
            avenue.title
          )}
        </Heading>
        <p className="avenue__line">{avenue.line}</p>
        <span className="avenue__arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
}

/** The three avenue cards, as the home page's only calls to action. */
export function AvenueCards(): React.JSX.Element {
  return (
    <ul className="avenues">
      {AVENUES.map((avenue) => (
        <AvenueCard key={avenue.to} avenue={avenue} headingLevel="h2" />
      ))}
    </ul>
  );
}

/** Closes an avenue page: the other two avenues and the contact form. */
export function NextSteps({ current }: { readonly current: string }): React.JSX.Element {
  return (
    <nav className="next-steps" aria-labelledby="next-steps-heading">
      <h2 className="eyebrow next-steps__heading" id="next-steps-heading">
        read more
      </h2>
      <ul className="avenues avenues--compact">
        {AVENUES.filter((avenue) => avenue.to !== current).map((avenue) => (
          <AvenueCard key={avenue.to} avenue={avenue} headingLevel="h3" />
        ))}
      </ul>
    </nav>
  );
}
