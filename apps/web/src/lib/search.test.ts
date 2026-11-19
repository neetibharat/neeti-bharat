import { describe, expect, it } from 'vitest';
import { isSearchShortcut, searchablePages } from './search';

describe('searchablePages', () => {
  it('lists each live page once', () => {
    const ids = searchablePages(true).map((page) => page.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('policies');
  });
});

describe('isSearchShortcut', () => {
  it('is Ctrl or Cmd with K', () => {
    expect(isSearchShortcut({ key: 'k', ctrlKey: true, metaKey: false })).toBe(true);
    expect(isSearchShortcut({ key: 'K', ctrlKey: false, metaKey: true })).toBe(true);
    expect(isSearchShortcut({ key: 'k', ctrlKey: false, metaKey: false })).toBe(false);
  });
});
