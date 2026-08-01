import * as React from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion';

/**
 * Wraps page content with a minimal fade + slide-up entrance animation.
 * Use inside an `<AnimatePresence mode="wait">` keyed by route path so
 * each navigation triggers a fresh transition.
 */
export function PageTransition({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
}
