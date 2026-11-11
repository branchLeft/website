import * as React from 'react';

const subscribeNoop = () => () => {};

/**
 * True once hydrated, false during SSR and the first client render. Mismatched
 * server/client snapshots make React reconcile to true right after hydration.
 */
export function useHasMounted(): boolean {
  return React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}
