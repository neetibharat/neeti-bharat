import { describe, expect, it } from 'vitest';
import { appendUnique, cardDue, hasMore, parseViewMode, requestsHref } from './request-board';

const NOW = new Date('2026-11-10T12:00:00Z');
const inDays = (days: number) => new Date(NOW.getTime() + days * 86_400_000).toISOString();

describe('cardDue', () => {
  it('counts down in neutral when the due date is a week or more away', () => {
    const due = cardDue({ status: 'new', dueAt: inDays(11.5), closedOnTime: null }, NOW);
    expect(due).toMatchObject({ kind: 'left', color: 'gray', time: { unit: 'days', days: 11 } });
  });

  it('turns to a warning within 7 days', () => {
    const due = cardDue({ status: 'in_progress', dueAt: inDays(3), closedOnTime: null }, NOW);
    expect(due).toMatchObject({ kind: 'left', color: 'warning', time: { days: 3 } });
  });

  it('is red and counts how late once the due date has passed', () => {
    const due = cardDue({ status: 'new', dueAt: inDays(-2.5), closedOnTime: null }, NOW);
    expect(due).toMatchObject({ kind: 'late', color: 'danger', time: { unit: 'days', days: 2 } });
  });

  it('says whether a done request closed on time or late, whatever its due date', () => {
    const base = { status: 'done' as const, dueAt: inDays(-30) };
    expect(cardDue({ ...base, closedOnTime: true }, NOW)).toEqual({
      kind: 'closedOnTime',
      color: 'success',
      time: null,
    });
    expect(cardDue({ ...base, closedOnTime: false }, NOW)).toMatchObject({
      kind: 'closedLate',
      color: 'danger',
    });
  });
});

describe('appendUnique', () => {
  it('adds the next page after the cards shown and skips any already there', () => {
    const shown = [{ id: 'a' }, { id: 'b' }];
    expect(appendUnique(shown, [{ id: 'b' }, { id: 'c' }]).map((card) => card.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

describe('hasMore', () => {
  const base = { filtered: false, limit: 10, matched: null };

  it('compares the cards shown with the head count when nothing is filtered', () => {
    expect(hasMore({ ...base, shown: 10, count: 14 })).toBe(true);
    expect(hasMore({ ...base, shown: 14, count: 14 })).toBe(false);
  });

  it('offers more on a full column while filtering, until a page says how many match', () => {
    expect(hasMore({ ...base, filtered: true, shown: 10, count: 40 })).toBe(true);
    expect(hasMore({ ...base, filtered: true, shown: 4, count: 40 })).toBe(false);
  });

  it('trusts the matched total from a loaded page over the head count', () => {
    expect(hasMore({ ...base, filtered: true, shown: 10, count: 40, matched: 10 })).toBe(false);
    expect(hasMore({ ...base, filtered: true, shown: 10, count: 40, matched: 12 })).toBe(true);
  });
});

describe('parseViewMode', () => {
  it('is the list only when the address says so', () => {
    expect(parseViewMode('list')).toBe('list');
    expect(parseViewMode(undefined)).toBe('board');
    expect(parseViewMode('board')).toBe('board');
    expect(parseViewMode(['list', 'list'])).toBe('board');
    expect(parseViewMode('nonsense')).toBe('board');
  });
});

describe('requestsHref', () => {
  it('leaves the board without a parameter', () => {
    expect(requestsHref('board')).toBe('/requests');
    expect(requestsHref('list')).toBe('/requests?view=list');
  });
});
