import * as React from 'react';
import { BlueskyIcon } from './icons/BlueskyIcon';
import { GitHubIcon } from './icons/GitHubIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { MediumIcon } from './icons/MediumIcon';

const SOCIALS = [
  { href: 'https://bsky.app/profile/branchleft.bsky.social', label: 'Bluesky', Icon: BlueskyIcon },
  { href: 'https://www.linkedin.com/company/branchleft', label: 'LinkedIn', Icon: LinkedInIcon },
  { href: 'https://medium.com/@branchleft', label: 'Medium', Icon: MediumIcon },
  { href: 'https://github.com/branchLeft', label: 'GitHub', Icon: GitHubIcon },
] as const;

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
      {SOCIALS.map(({ href, label, Icon }) => (
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
      ))}
    </>
  );
}
