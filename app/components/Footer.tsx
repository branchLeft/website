import * as React from 'react';
import { Link } from 'react-router';

export function Footer(): React.JSX.Element {
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
        </ul>
      </div>
    </footer>
  );
}
