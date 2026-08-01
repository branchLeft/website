import * as React from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion';
import { useHasMounted } from '../lib/useHasMounted';

type Solution = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
};

/**
 * Tabbed showcase for the About page Solutions section.
 *
 * Layout:
 *   - Desktop (`md`+): vertical tablist on the left, single expanded panel on
 *     the right — the panel occupies the same reading column as the rest of
 *     the About page (no viewport breakout, unlike the values carousel).
 *   - Mobile: tablist runs horizontally above the panel; both stack in a
 *     single column.
 *
 * Panel transitions crossfade via framer-motion and are skipped when the
 * viewer prefers reduced motion.
 *
 * Follows the WAI-ARIA authoring practices Tabs pattern:
 *   - `role="tablist"` on the tab container with `aria-orientation`.
 *   - Roving tabindex on tabs (only the active tab is in the tab order).
 *   - Arrow keys move focus + activate; Home/End jump to first/last.
 *
 * The Bespoke Technology CTA links to the contact form with a preset
 * category query param; the contact route whitelists inbound values before
 * pre-selecting the matching option.
 */
const SOLUTIONS: readonly Solution[] = [
  {
    id: 'local-news',
    title: 'Local News & Independent Media',
    body: "We're building a platform to support journalists reporting on local issues in the UK. Not just hosting and CMS; we're building a professional and technical ecosystem to get high-quality reporting to every county and ward. Whether you're an established outlet, looking to grow your viewership, looking to build sustainable revenue, or just starting out, we've got the expertise you need.",
    ctaLabel: 'learn more',
    ctaHref: '/solutions/local-news',
  },
  {
    id: 'affordable-websites',
    title: 'Affordable Websites',
    body: 'We can build and host your ideal website. Delivered at-cost for eligible UK-based entities working in the public interest.',
    ctaLabel: 'learn more',
    ctaHref: '/solutions/affordable-websites',
  },
  {
    id: 'bespoke-technology',
    title: 'Bespoke Technology',
    body: "Leveraging Robert's expertise, we can bring anything from the simplest to the most ambitious vision to life. What technology do you want to build to change the world for the better?",
    ctaLabel: 'tell us more',
    ctaHref: '/contact?category=bespoke-technology',
  },
];

export function SolutionsShowcase(): React.JSX.Element {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const prefersReduced = usePrefersReducedMotion();

  // Without JS, `activeIndex` never changes from its initial value, so the
  // two non-active panels would otherwise SSR as `aria-hidden="true"` and
  // `tabIndex={-1}` forever — hiding their content from assistive tech and
  // keyboard-only users even though the no-js.css fallback makes it visually
  // reachable. Deferring both to post-mount keeps the real roving-tabindex
  // tab behaviour once JS is actually running.
  const hasMounted = useHasMounted();

  function focusTab(index: number) {
    const clamped = ((index % SOLUTIONS.length) + SOLUTIONS.length) % SOLUTIONS.length;
    setActiveIndex(clamped);
    tabRefs.current[clamped]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(SOLUTIONS.length - 1);
        break;
      default:
        break;
    }
  }

  const tabId = (id: string) => `solutions-tab-${id}`;
  const panelId = (id: string) => `solutions-panel-${id}`;

  return (
    <div className="solutions-tabs">
      <div className="solutions-tabs__tablist" role="tablist" aria-label="Solutions">
        {SOLUTIONS.map((solution, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={solution.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={tabId(solution.id)}
              className="solutions-tabs__tab"
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId(solution.id)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="solutions-tabs__tab-title">{solution.title}</span>
            </button>
          );
        })}
      </div>

      <div className="solutions-tabs__panel-frame">
        {SOLUTIONS.map((solution, index) => {
          const isActive = index === activeIndex;
          const rovingTabIndex = !hasMounted || isActive ? 0 : -1;
          return (
            <motion.div
              key={solution.id}
              id={panelId(solution.id)}
              className="solutions-tabs__panel"
              role="tabpanel"
              aria-labelledby={tabId(solution.id)}
              aria-hidden={hasMounted ? !isActive : false}
              style={{ pointerEvents: isActive ? undefined : 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeOut' }}
            >
              <p className="solutions-tabs__panel-body">{solution.body}</p>
              <Link
                className="directional-link directional-link--underline cta"
                to={solution.ctaHref}
                aria-label={`${solution.ctaLabel} about ${solution.title}`}
                tabIndex={rovingTabIndex}
              >
                <span className="directional-link__label">{solution.ctaLabel}</span>
                <span className="directional-link__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
