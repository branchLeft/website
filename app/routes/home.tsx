import { Logo } from '@branchleft/components';
import { SocialLinksItems } from '../components/SocialLinksItems';
import { buildMeta } from '../lib/meta';

export function meta() {
  return buildMeta({
    title: 'branchLeft',
    description:
      'branchLeft is a 100% worker-owned UK company building affordable, ethical technology for people and planet — no private equity, no profit extraction.',
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
