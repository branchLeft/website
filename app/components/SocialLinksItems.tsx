import * as React from 'react';
import { BlueskyIcon } from './icons/BlueskyIcon';
import { GitHubIcon } from './icons/GitHubIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { MediumIcon } from './icons/MediumIcon';
import { SOCIAL_LINKS } from '../lib/social-links';

// Icons live here, not in the shared `app/lib/social-links.ts` list, so that
// module can stay plain data (it's also consumed by meta.ts, which has no
// other reason to import React components).
const ICONS: Record<string, React.ComponentType<{ readonly className?: string }>> = {
  Bluesky: BlueskyIcon,
  LinkedIn: LinkedInIcon,
  Medium: MediumIcon,
  GitHub: GitHubIcon,
};

/**
 * Renders bare `<li>`s for each social link — no `<ul>` of its own — so
 * callers can embed the icons inside whichever list they already own
 * (site-footer__links, home-socials, …), matching the fragment-of-`<li>`s
 * pattern NavBar.tsx uses for NavLinksItems.
 */
export function SocialLinksItems({
  linkClassName,
  iconClassName,
}: {
  readonly linkClassName: string;
  readonly iconClassName: string;
}): React.JSX.Element {
  return (
    <>
      {SOCIAL_LINKS.map(({ href, label }) => {
        const Icon = ICONS[label];
        return (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={linkClassName}
            >
              <Icon className={iconClassName} />
            </a>
          </li>
        );
      })}
    </>
  );
}
