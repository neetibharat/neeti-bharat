import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES } from './locales.js';

describe('locales', () => {
  it('includes the default locale', () => {
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });
});
