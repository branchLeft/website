import { describe, expect, it } from 'vitest';
import { isKnownCategory } from './contact';

describe('isKnownCategory', () => {
  it('accepts known category slugs', () => {
    expect(isKnownCategory('local-news')).toBe(true);
    expect(isKnownCategory('affordable-websites')).toBe(true);
    expect(isKnownCategory('bespoke-technology')).toBe(true);
    expect(isKnownCategory('general')).toBe(true);
  });

  it('rejects unknown or malicious values', () => {
    expect(isKnownCategory('not-a-category')).toBe(false);
    expect(isKnownCategory('<script>alert(1)</script>')).toBe(false);
    expect(isKnownCategory('')).toBe(false);
    expect(isKnownCategory(null)).toBe(false);
  });
});
