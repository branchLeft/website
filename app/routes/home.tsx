import { Logo } from '@branchleft/brand-branchleft';
import { AvenueCards } from '../components/Avenues';
import { SocialLinksItems } from '../components/SocialLinksItems';
import { buildMeta } from '../lib/meta';

export function meta() {
  return buildMeta({
    title: 'branchLeft',
    description:
      'branchLeft is a 100% worker-owned UK company building affordable, ethical technology for people and planet.',
    path: '/',
  });
}

/* The home page's only calls to action are the three avenue cards. */
export default function Home() {
  return (
    <main className="home">
      <header className="home-hero">
        <Logo role="img" aria-label="branchLeft logo" className="home-hero__mark" />
        <div className="home-hero__text">
          <h1 className="bl-wordmark">branchLeft</h1>
          <p className="tagline">
            building tech for <span className="hover-green">people</span> &{' '}
            <span className="hover-green">planet</span>
          </p>
        </div>
      </header>
      <AvenueCards />
      <ul className="home-socials">
        <SocialLinksItems linkClassName="home-socials__link" iconClassName="home-socials__icon" />
      </ul>
    </main>
  );
}
