import * as React from 'react';

export type Section = { id: string; label: string };

type SectionNavProps = {
  readonly sections: readonly Section[];
  readonly ariaLabel?: string;
};

/**
 * Sticky in-page section nav with scrollspy.
 *
 * - Anchor links (#id) with smooth-scroll (respects prefers-reduced-motion).
 * - Active section tracked via a single IntersectionObserver.
 * - `aria-current="location"` on the active link.
 * - Sticks directly under the primary nav via var(--nav-offset).
 */
export function SectionNav({
  sections,
  ariaLabel = 'Section navigation',
}: SectionNavProps): React.JSX.Element {
  const [activeId, setActiveId] = React.useState<string>(sections[0]?.id ?? '');

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // Resolve --nav-offset to pixels. IntersectionObserver's rootMargin
    // does not accept calc()/var() — only px or %.
    const rootFontSize =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const rawOffset = getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-offset')
      .trim();
    let offsetPx = 56;
    if (rawOffset.endsWith('rem')) {
      offsetPx = Number.parseFloat(rawOffset) * rootFontSize;
    } else if (rawOffset.endsWith('px')) {
      offsetPx = Number.parseFloat(rawOffset);
    }

    // Track intersection ratios so the "most visible" section wins even when
    // several are on screen at once (e.g. short sections near the top).
    const visibility = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId = '';
        let bestRatio = 0;
        for (const [id, ratio] of visibility) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId !== '') setActiveId(bestId);
      },
      {
        // Shrink the viewport so a section is "active" once its top clears
        // the sticky nav stack and while its body is in the top half.
        rootMargin: `-${offsetPx}px 0px -55% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      const el = document.getElementById(id);
      if (el === null) return; // let the browser handle if missing
      event.preventDefault();

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
      setActiveId(id);
    },
    []
  );

  return (
    <nav className="section-nav" aria-label={ariaLabel}>
      <ul className="section-nav__inner">
        {sections.map(({ id, label }) => {
          const isActive = id === activeId;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`section-nav__link${isActive ? ' section-nav__link--active' : ''}`}
                aria-current={isActive ? 'location' : undefined}
                onClick={(e) => handleClick(e, id)}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
