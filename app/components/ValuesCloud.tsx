import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion';
import { useHasMounted } from '../lib/useHasMounted';

export type ValueAccent =
  'sustainability' | 'environment' | 'ai' | 'society' | 'opensource' | 'agility' | 'redlines';

export type Value = {
  readonly title: string;
  readonly icon?: React.ComponentType<{ className?: string }>;
  readonly body?: React.ReactNode;
  readonly accent: ValueAccent;
};

type ValuesCloudProps = {
  readonly values: readonly Value[];
  readonly ariaLabel?: string;
};

const SPEECH_ID = 'values-cloud-speech';
const SPEECH_TITLE_ID = 'values-cloud-speech-title';
const SPEECH_BODY_ID = 'values-cloud-speech-body';
const accordionTriggerId = (accent: ValueAccent) => `values-cloud-accordion-trigger-${accent}`;
const accordionPanelId = (accent: ValueAccent) => `values-cloud-accordion-panel-${accent}`;

/**
 * Cloud of 7 orbiting value icons around a central hint (desktop, above
 * ~425px), falling back to a collapsed accordion on small mobile. Both
 * views share a single `openValueId` state — selecting a value is a plain
 * disclosure toggle (`aria-expanded`/`aria-controls`), not a modal:
 *   - Desktop: the selected bubble animates to a fixed spot at the centre
 *     of the ring (replacing the hint text), the rest of the cloud dims,
 *     and a boxy speech-bubble panel grows out of it with the full text.
 *     Above 768px the whole cloud additionally slides to sit alongside the
 *     speech bubble rather than on top of it.
 *   - Small mobile: the same state expands an accordion panel in place.
 * Nothing is inert and there's no focus trap — background bubbles stay
 * clickable so switching the selection is a direct, one-click action.
 *
 * The actual "Values" heading is a sibling rendered by the caller (see
 * about.tsx) — it stays a normal top-of-section heading rather than being
 * pulled into the ring, so its anchor-link affordance isn't decentered by
 * the ring's circular geometry.
 */
export function ValuesCloud({ values, ariaLabel = 'Values' }: ValuesCloudProps): React.JSX.Element {
  const [openValueId, setOpenValueId] = React.useState<ValueAccent | null>(null);
  const selectedTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const prefersReduced = usePrefersReducedMotion();

  // Without JS, `openValueId` never changes from its initial `null`, so
  // every accordion panel would otherwise SSR as `aria-hidden="true"`
  // forever — hiding all 7 value descriptions from assistive tech even
  // though the no-js.css fallback force-opens them visually.
  const hasMounted = useHasMounted();

  const activeValue = values.find((v) => v.accent === openValueId) ?? null;

  const deselect = React.useCallback(() => {
    setOpenValueId(null);
    selectedTriggerRef.current?.focus();
  }, []);

  function selectRingValue(value: Value, trigger: HTMLButtonElement) {
    if (openValueId === value.accent) {
      setOpenValueId(null);
      return;
    }
    selectedTriggerRef.current = trigger;
    setOpenValueId(value.accent);
  }

  // Escape closes the speech bubble — a plain keydown listener is enough
  // since this isn't a modal (nothing is inert, no focus trap to release).
  React.useEffect(() => {
    if (openValueId === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') deselect();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openValueId, deselect]);

  const speechTransition = { duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' as const };

  return (
    <div className={activeValue ? 'values-cloud values-cloud--selected' : 'values-cloud'}>
      <motion.div
        className="values-cloud__stage"
        layout
        transition={{ duration: prefersReduced ? 0 : 0.4, ease: 'easeOut' }}
      >
        <div className="values-cloud__hub">
          <p className="values-cloud__hub-text">select one of the values to learn more</p>
        </div>
        <div className="values-cloud__ring">
          <ul className="values-cloud__nodes" aria-label={ariaLabel}>
            {values.map((value, index) => {
              const isSelected = openValueId === value.accent;
              return (
                <li
                  key={value.accent}
                  className={
                    isSelected
                      ? 'values-cloud__node values-cloud__node--selected'
                      : 'values-cloud__node'
                  }
                  style={{ '--i': index, '--n': values.length } as React.CSSProperties}
                >
                  <div className="values-cloud__node-inner" data-accent={value.accent}>
                    <button
                      type="button"
                      className="values-cloud__trigger"
                      aria-expanded={isSelected}
                      aria-controls={SPEECH_ID}
                      aria-label={value.title}
                      onClick={(event) => selectRingValue(value, event.currentTarget)}
                    >
                      {value.icon && (
                        <value.icon className="values-cloud__icon" aria-hidden="true" />
                      )}
                    </button>
                    <span className="values-cloud__label" aria-hidden="true">
                      {value.title}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>

      <div className="values-cloud__speech-area">
        <div id={SPEECH_ID} className="values-cloud__speech" aria-hidden={!activeValue}>
          <AnimatePresence mode="popLayout">
            {activeValue && (
              <motion.div
                key={activeValue.accent}
                className="values-cloud__speech-box"
                data-accent={activeValue.accent}
                initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.9 }}
                transition={speechTransition}
              >
                <button
                  type="button"
                  className="values-cloud__speech-close"
                  onClick={deselect}
                  aria-label={`Close ${activeValue.title}`}
                >
                  <X aria-hidden="true" />
                </button>
                <h3 id={SPEECH_TITLE_ID} className="values-cloud__speech-title">
                  {activeValue.icon && (
                    <activeValue.icon className="values-cloud__icon" aria-hidden="true" />
                  )}
                  {activeValue.title}
                </h3>
                {activeValue.body && (
                  <p id={SPEECH_BODY_ID} className="values-cloud__speech-body">
                    {activeValue.body}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="values-cloud__accordion">
        {values.map((value) => {
          const isOpen = openValueId === value.accent;
          return (
            <div
              key={value.accent}
              className="values-cloud__accordion-item"
              data-accent={value.accent}
            >
              <h3 className="values-cloud__accordion-heading">
                <button
                  type="button"
                  id={accordionTriggerId(value.accent)}
                  className="values-cloud__accordion-trigger"
                  aria-expanded={isOpen}
                  aria-controls={accordionPanelId(value.accent)}
                  onClick={() => setOpenValueId(isOpen ? null : value.accent)}
                >
                  {value.icon && <value.icon className="values-cloud__icon" aria-hidden="true" />}
                  <span className="values-cloud__accordion-title">{value.title}</span>
                  <ChevronDown className="values-cloud__accordion-chevron" aria-hidden="true" />
                </button>
              </h3>
              <section
                id={accordionPanelId(value.accent)}
                aria-labelledby={accordionTriggerId(value.accent)}
                aria-hidden={hasMounted ? !isOpen : false}
                className={
                  isOpen
                    ? 'values-cloud__accordion-panel values-cloud__accordion-panel--open'
                    : 'values-cloud__accordion-panel'
                }
              >
                <div className="values-cloud__accordion-panel-inner">
                  {value.body && <p className="values-cloud__accordion-body">{value.body}</p>}
                </div>
              </section>
            </div>
          );
        })}
      </div>
    </div>
  );
}
