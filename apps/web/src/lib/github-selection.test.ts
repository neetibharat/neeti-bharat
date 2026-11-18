import { describe, expect, it } from 'vitest';
import {
  matchingRepositories,
  pickedCount,
  selectionOf,
  selectionIsUsable,
  selectionToSend,
  toggled,
  withAll,
  withoutAll,
} from './github-selection';

const repositories = [
  { name: 'acme/api', isPrivate: true },
  { name: 'acme/Web', isPrivate: false },
  { name: 'acme/docs', isPrivate: false },
];

describe('matchingRepositories', () => {
  it('finds a name by what was typed, in any case, and gives all of them for nothing', () => {
    expect(matchingRepositories(repositories, 'WEB').map((r) => r.name)).toEqual(['acme/Web']);
    expect(matchingRepositories(repositories, '  ')).toHaveLength(3);
    expect(matchingRepositories(repositories, 'nothing')).toEqual([]);
  });
});

describe('toggled', () => {
  it('adds a name that was not picked, and removes one that was', () => {
    expect(toggled(['a/b'], 'c/d')).toEqual(['a/b', 'c/d']);
    expect(toggled(['a/b', 'c/d'], 'a/b')).toEqual(['c/d']);
  });
});

describe('withAll and withoutAll', () => {
  it('adds the names that are shown once each, and takes them away again', () => {
    expect(withAll(['a/b'], ['a/b', 'c/d'])).toEqual(['a/b', 'c/d']);
    expect(withoutAll(['a/b', 'c/d', 'e/f'], ['a/b', 'e/f'])).toEqual(['c/d']);
  });
});

describe('selectionOf', () => {
  it('reads the kept choice: all, or the names that were picked', () => {
    expect(selectionOf({ mode: 'selected', repositories: 'a/b,c/d' })).toEqual({
      mode: 'selected',
      repositories: ['a/b', 'c/d'],
    });
    expect(selectionOf({ mode: 'all', repositories: '' })).toEqual({
      mode: 'all',
      repositories: [],
    });
    expect(selectionOf({})).toEqual({ mode: 'all', repositories: [] });
  });
});

describe('selection', () => {
  it('lets all repositories through, and picked ones only when there is one', () => {
    expect(selectionIsUsable({ mode: 'all', repositories: [] })).toBe(true);
    expect(selectionIsUsable({ mode: 'selected', repositories: [] })).toBe(false);
    expect(selectionIsUsable({ mode: 'selected', repositories: ['a/b'] })).toBe(true);
  });

  it('sends no names for all repositories, even if some were ticked before', () => {
    expect(selectionToSend({ mode: 'all', repositories: ['a/b'] })).toEqual({
      mode: 'all',
      repositories: [],
    });
    expect(selectionToSend({ mode: 'selected', repositories: ['a/b'] })).toEqual({
      mode: 'selected',
      repositories: ['a/b'],
    });
  });

  it('counts only picked repositories', () => {
    expect(pickedCount({ mode: 'all', repositories: [] })).toBeNull();
    expect(pickedCount({ mode: 'selected', repositories: ['a/b', 'c/d'] })).toBe(2);
  });
});
