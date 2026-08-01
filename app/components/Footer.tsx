import * as React from 'react';
import { Link, useLocation } from 'react-router';
import { SocialLinksItems } from './SocialLinksItems';

export function Footer(): React.JSX.Element {
  const { pathname } = useLocation();
  const isHomePage = pathname === '/';

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer__inner">
        <small className="eyebrow site-footer__copy">
          © 2026 BRANCHLEFT LTD. All rights reserved.
        </small>
        <ul className="site-footer__links">
          <li>
            <Link to="/privacy" className="eyebrow site-footer__link">
              Privacy
            </Link>
          </li>
          <li>
            <Link to="/terms" className="eyebrow site-footer__link">
              Terms
            </Link>
          </li>
          {/* Homepage already shows these icons in the hero — omit here to avoid redundancy. */}
          {!isHomePage ? (
            <SocialLinksItems
              linkClassName="site-footer__social-link"
              iconClassName="site-footer__social-icon"
            />
          ) : null}
        </ul>
      </div>
    </footer>
  );
}
