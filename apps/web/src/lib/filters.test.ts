import { describe, expect, it } from 'vitest';
import { ALL, matchesSearch } from './filters';

describe('matchesSearch', () => {
  it('matches everything when the search is empty or blank', () => {
    expect(matchesSearch(['Anything'], '')).toBe(true);
    expect(matchesSearch([], '   ')).toBe(true);
  });

  it('ignores case and outer spaces', () => {
    expect(matchesSearch(['Data Retention'], '  RETEN ')).toBe(true);
  });

  it('matches when any one field contains the search', () => {
    expect(matchesSearch(['alpha', null, 'beta'], 'bet')).toBe(true);
  });

  it('does not match when no field contains it, or when fields are empty', () => {
    expect(matchesSearch(['alpha', undefined], 'zeta')).toBe(false);
    expect(matchesSearch([null, undefined], 'a')).toBe(false);
  });

  it('exposes the shared "no limit" value', () => {
    expect(ALL).toBe('all');
  });
});
