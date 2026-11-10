import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, isLocale } from './locales.js';

describe('locales', () => {
  it('includes the default locale', () => {
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });

  it('accepts supported codes and rejects everything else', () => {
    expect(isLocale('hi')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
