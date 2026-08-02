import * as React from 'react';
import { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useHasMounted } from './useHasMounted';

declare global {
  // React reads this flag to decide whether act()-wrapped renders should
  // flush synchronously; without it, act() warns that effects may be missed.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
  const hasMounted = useHasMounted();
  return React.createElement('span', null, hasMounted ? 'mounted' : 'not-mounted');
}

describe('useHasMounted', () => {
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (container) {
      container.remove();
      container = null;
    }
  });

  it('reports false when rendered on the server', () => {
    const html = renderToString(React.createElement(Probe));
    expect(html).toContain('not-mounted');
  });

  it('reports true on a plain client-side render (no prior server markup)', () => {
    container = document.body.appendChild(document.createElement('div'));

    act(() => {
      createRoot(container as HTMLDivElement).render(React.createElement(Probe));
    });

    expect(container.textContent).toBe('mounted');
  });

  it('reconciles from false to true when hydrating server-rendered markup, without a hydration-mismatch warning', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    container = document.body.appendChild(document.createElement('div'));
    container.innerHTML = renderToString(React.createElement(Probe));
    expect(container.textContent).toBe('not-mounted');

    act(() => {
      hydrateRoot(container as HTMLDivElement, React.createElement(Probe));
    });

    expect(container.textContent).toBe('mounted');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
