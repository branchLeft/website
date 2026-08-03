import { Logo } from '@branchleft/components';
import { SocialLinksItems } from '../components/SocialLinksItems';
import { buildMeta } from '../lib/meta';

export function meta() {
  return buildMeta({
    title: 'branchLeft',
    // ALL_CAPS placeholder — see CLAUDE.md's "never write prose" rule. This
    // is the single most-linked page on the site (shared on LinkedIn,
    // Bluesky, Slack via the footer), so it needs a real one/two-sentence
    // description before this is content-complete.
    description: 'TODO_HOMEPAGE_DESCRIPTION',
    path: '/',
  });
}

export default function Home() {
  return (
    <main className="page-shell">
      <Logo role="img" aria-label="branchLeft logo" className="brand-mark" />
      <h1 className="hero-wordmark">branchLeft</h1>
      <p className="tagline">
        building tech for <span className="hover-green">people</span> &{' '}
        <span className="hover-green">planet</span>
      </p>
      <a className="directional-link directional-link--underline" href="/about">
        <span className="directional-link__label">learn more</span>
        <span className="directional-link__arrow" aria-hidden="true">
          →
        </span>
      </a>
      <ul className="home-socials">
        <SocialLinksItems linkClassName="home-socials__link" iconClassName="home-socials__icon" />
      </ul>
    </main>
  );
}
