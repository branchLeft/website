import * as React from 'react';

export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // SSR / initial render fallback — assume motion is fine so animations
    // aren't stripped from the very first client render.
    () => false
  );
}
