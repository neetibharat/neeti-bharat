import { describe, expect, it } from 'vitest';
import {
  RECENT_LIMIT,
  isSearchShortcut,
  loadRecent,
  quickActionsFor,
  rememberRecent,
  searchHref,
  searchablePages,
} from './search';

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
};

describe('searchablePages', () => {
  it('lists each live page once', () => {
    const ids = searchablePages(true).map((page) => page.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('policies');
    expect(ids).toContain('deadlines');
  });

  it('lists the AI help page only where the install has an AI service', () => {
    expect(searchablePages(true).map((page) => page.id)).not.toContain('aiHelp');
    expect(searchablePages(true, true).map((page) => page.id)).toContain('aiHelp');
  });
});

describe('searchHref', () => {
  it('opens a control on the rule it sits under', () => {
    const hit = {
      kind: 'control',
      id: 'c1',
      title: 'x',
      frameworkId: 'dpdp',
      ruleId: 'R6',
    } as const;
    expect(searchHref(hit)).toBe('/frameworks/dpdp/rules/R6');
  });

  it('opens a rule on its own page', () => {
    const hit = { kind: 'rule', id: 'R7', title: 'x', frameworkId: 'dpdp' } as const;
    expect(searchHref(hit)).toBe('/frameworks/dpdp/rules/R7');
  });
});

describe('quickActionsFor', () => {
  it('gives an auditor none, and only an admin the people action', () => {
    expect(quickActionsFor(false, false)).toEqual([]);
    expect(quickActionsFor(true, false).map((action) => action.id)).not.toContain('person');
    expect(quickActionsFor(true, true).map((action) => action.id)).toContain('person');
  });
});

describe('recent searches', () => {
  it('keeps the newest first, once each, and no more than the limit', () => {
    const store = memory();
    for (let i = 0; i < RECENT_LIMIT + 2; i += 1) {
      rememberRecent(store, { key: `k${i}`, href: '/x', title: `T${i}` });
    }
    rememberRecent(store, { key: 'k3', href: '/x', title: 'T3' });
    const recent = loadRecent(store);
    expect(recent).toHaveLength(RECENT_LIMIT);
    expect(recent[0]!.key).toBe('k3');
    expect(recent.filter((entry) => entry.key === 'k3')).toHaveLength(1);
  });

  it('survives a store that holds rubbish or is missing', () => {
    expect(loadRecent(undefined)).toEqual([]);
    expect(loadRecent({ getItem: () => 'not json', setItem: () => {} })).toEqual([]);
    expect(loadRecent({ getItem: () => '[1,{"key":"a"}]', setItem: () => {} })).toEqual([]);
  });
});

describe('isSearchShortcut', () => {
  it('is Ctrl or Cmd with K', () => {
    expect(isSearchShortcut({ key: 'k', ctrlKey: true, metaKey: false })).toBe(true);
    expect(isSearchShortcut({ key: 'K', ctrlKey: false, metaKey: true })).toBe(true);
    expect(isSearchShortcut({ key: 'k', ctrlKey: false, metaKey: false })).toBe(false);
  });
});
