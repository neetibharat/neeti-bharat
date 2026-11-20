import { describe, expect, it } from 'vitest';
import { THEME_BOOT_SCRIPT, THEME_KEY, isThemeChoice, resolveTheme } from './theme';

describe('resolveTheme', () => {
  it('follows the device only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('isThemeChoice', () => {
  it('accepts the three choices and nothing else', () => {
    expect(['system', 'light', 'dark'].every(isThemeChoice)).toBe(true);
    expect(isThemeChoice('blue')).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
  });
});

describe('THEME_BOOT_SCRIPT', () => {
  it('reads the same key the app writes', () => {
    expect(THEME_BOOT_SCRIPT).toContain(`'${THEME_KEY}'`);
  });
});
