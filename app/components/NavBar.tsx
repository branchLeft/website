import * as React from 'react';
import { NavLink, useLocation } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { Logo } from '@branchleft/components';

type NavLinkItem = { to: string; label: string; end: boolean };
type NavDropdownItem = { label: string; children: readonly NavLinkItem[] };

const NAV_LINKS: readonly (NavLinkItem | NavDropdownItem)[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About', end: false },
  {
    label: 'Solutions',
    children: [
      { to: '/solutions/local-news', label: 'Local News', end: false },
      { to: '/solutions/affordable-websites', label: 'Affordable Websites', end: false },
    ],
  },
  { to: '/contact', label: 'Contact', end: false },
];

function isDropdown(item: NavLinkItem | NavDropdownItem): item is NavDropdownItem {
  return 'children' in item;
}

function NavDropdown({
  item,
  onNavigate,
}: {
  readonly item: NavDropdownItem;
  readonly onNavigate?: () => void;
}): React.JSX.Element {
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  const location = useLocation();

  const isAnyChildActive = item.children.some((child) => {
    if (child.end) {
      return location.pathname === child.to;
    }
    return location.pathname.startsWith(child.to);
  });

  React.useEffect(() => {
    function closeIfOutside(event: PointerEvent) {
      if (detailsRef.current !== null && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || detailsRef.current?.open !== true) return;
      detailsRef.current.open = false;
      detailsRef.current.querySelector('summary')?.focus();
    }
    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function handleLinkClick() {
    if (detailsRef.current !== null) detailsRef.current.open = false;
    onNavigate?.();
  }

  return (
    <li className="site-nav__item">
      <details ref={detailsRef} className="site-nav__details">
        <summary
          className={`site-nav__link site-nav__summary${isAnyChildActive ? ' site-nav__link--active' : ''}`}
        >
          {item.label}
          <ChevronDown size="1em" className="site-nav__chevron chevron-icon" aria-hidden="true" />
        </summary>
        <ul className="site-nav__submenu">
          {item.children.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                end={child.end}
                className={({ isActive }) =>
                  `site-nav__sublink${isActive ? ' site-nav__link--active' : ''}`
                }
                onClick={handleLinkClick}
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

/**
 * Renders the Home/About/Solutions/Contact `<li>`s. Used twice — once inside
 * the mobile `<details>` disclosure, once in a plain always-visible `<ul>`
 * for desktop (see NavBar below) — because a browser's native `<details>`
 * collapse can't be reliably forced open via CSS alone (confirmed: even a
 * `display: flex !important` override on the child leaves it unrendered),
 * so the desktop nav can't depend on the mobile toggle's `<details>` at all.
 * Same "duplicate markup, pick one via a breakpoint" approach already used
 * for the Values cloud's ring vs. accordion (see values-cloud.css).
 */
function NavLinksItems({ onNavigate }: { readonly onNavigate?: () => void }): React.JSX.Element {
  return (
    <>
      {NAV_LINKS.map((item) =>
        isDropdown(item) ? (
          <NavDropdown key={item.label} item={item} onNavigate={onNavigate} />
        ) : (
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
        )
      )}
    </>
  );
}

export function NavBar(): React.JSX.Element {
  const mobileDetailsRef = React.useRef<HTMLDetailsElement>(null);

  function closeMobileMenu() {
    if (mobileDetailsRef.current !== null) mobileDetailsRef.current.open = false;
  }

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <div className="site-nav__inner">
        <NavLink to="/" className="site-nav__brand" onClick={closeMobileMenu}>
          <Logo className="site-nav__logo" aria-hidden="true" />
          <span className="logo-font">branchLeft</span>
        </NavLink>

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
      </div>
    </nav>
  );
}
