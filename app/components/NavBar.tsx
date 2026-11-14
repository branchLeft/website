import * as React from 'react';
import { NavLink, useLocation } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from '@branchleft/brand-branchleft';
import { ThemeToggle, type Theme } from '@branchleft/components';

type NavLinkItem = { to: string; label: string; end: boolean };

const NAV_LINKS: readonly NavLinkItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/publicpress', label: 'PublicPress', end: false },
  { to: '/about', label: 'About', end: false },
  { to: '/bespoke', label: 'Bespoke Solutions', end: false },
  { to: '/contact', label: 'Contact', end: false },
];

const BLOG_URL = 'https://blog.branchleft.co.uk/';

/**
 * Renders the primary `<li>`s. Used twice — once inside
 * the mobile `<details>` disclosure, once in a plain always-visible `<ul>`
 * for desktop (see NavBar below) — because a browser's native `<details>`
 * collapse can't be reliably forced open via CSS alone (confirmed: even a
 * `display: flex !important` override on the child leaves it unrendered),
 * so the desktop nav can't depend on the mobile toggle's `<details>` at all.
 */
function NavLinksItems({ onNavigate }: { readonly onNavigate?: () => void }): React.JSX.Element {
  return (
    <>
      {NAV_LINKS.map((item) => (
        <li key={item.to} className="site-nav__item">
          <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `site-nav__link${isActive ? ' site-nav__link--active' : ''}`
            }
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </>
  );
}

export function NavBar({ theme }: { readonly theme: Theme }): React.JSX.Element {
  const location = useLocation();
  const mobileDetailsRef = React.useRef<HTMLDetailsElement>(null);

  function closeMobileMenu() {
    if (mobileDetailsRef.current !== null) mobileDetailsRef.current.open = false;
  }

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <div className="site-nav__inner">
        <NavLink to="/" className="site-nav__brand" onClick={closeMobileMenu}>
          <Logo className="site-nav__logo" aria-hidden="true" />
          <span className="bl-wordmark">branchLeft</span>
        </NavLink>

        {/* Outside the collapsible links, so it is reachable at every width.
            With JavaScript off it posts to the theme route, which sends the
            visitor back to this page. */}
        <ThemeToggle
          className="site-nav__theme-toggle"
          theme={theme}
          action="/theme"
          returnTo={`${location.pathname}${location.search}`}
        />

        <details ref={mobileDetailsRef} className="site-nav__mobile-details">
          <summary className="site-nav__toggle" aria-label="Toggle navigation menu">
            <span
              className="pb-0.75 site-nav__toggle-icon site-nav__toggle-icon--closed"
              aria-hidden="true"
            >
              ☰
            </span>
            <span className="site-nav__toggle-icon site-nav__toggle-icon--open" aria-hidden="true">
              ✕
            </span>
            <span className="eyebrow site-nav__toggle-label">MENU</span>
          </summary>

          <ul className="site-nav__links">
            <NavLinksItems onNavigate={closeMobileMenu} />
          </ul>
        </details>

        <ul className="site-nav__links site-nav__links--desktop">
          <NavLinksItems />
        </ul>

        {/* Outside both link lists, so it shows in the bar at every width
            without opening the menu. */}
        <a href={BLOG_URL} className="site-nav__blog">
          Blog
          <ArrowUpRight size="1em" className="site-nav__blog-icon" aria-hidden="true" />
        </a>
      </div>
    </nav>
  );
}
