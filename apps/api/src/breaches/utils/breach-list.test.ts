import type { BreachStep } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { breachCounts, breachList } from './breach-list';
import type { BreachSummaryRow } from './breach-view';

const HOUR = 3_600_000;
const NOW = new Date('2026-11-10T12:00:00Z');
const clock = { windowMs: 72 * HOUR, now: NOW };
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * HOUR);

function row(id: string, foundHoursAgo: number, done: BreachStep[]): BreachSummaryRow {
  return {
    id,
    title: `Breach ${id}`,
    foundAt: hoursAgo(foundHoursAgo),
    peopleAffected: null,
    assignee: null,
    steps: done.map((step, index) => ({ step, completedAt: hoursAgo(foundHoursAgo - index) })),
  };
}

const FRESH: BreachStep[] = ['found'];
const ALL: BreachStep[] = ['found', 'assess', 'tell_board', 'tell_people', 'close'];

const rows = [
  row('fresh', 10, FRESH),
  row('late', 100, ['found', 'assess']),
  row('told', 100, ['found', 'assess', 'tell_board']),
  row('closed-old', 200, ALL),
  row('closed-new', 20, ALL),
];

describe('breachCounts', () => {
  it('counts open, closed and late breaches', () => {
    expect(breachCounts(rows, clock)).toEqual({ open: 3, closed: 2, overdue: 1 });
  });

  it('counts nothing for no breaches', () => {
    expect(breachCounts([], clock)).toEqual({ open: 0, closed: 0, overdue: 0 });
  });
});

describe('breachList', () => {
  const query = { tab: 'open' as const, page: 1, limit: 25 };

  it('puts late breaches first, then the one found longest ago', () => {
    const { items } = breachList(rows, rows, query, clock);
    expect(items.map((item) => item.id)).toEqual(['late', 'told', 'fresh']);
    expect(items[0]).toMatchObject({ overdue: true, currentStep: 'tell_board', closedAt: null });
  });

  it('shows closed breaches on their own tab, latest closed first, with no current step', () => {
    const { items, total } = breachList(rows, rows, { ...query, tab: 'closed' }, clock);
    expect(items.map((item) => item.id)).toEqual(['closed-new', 'closed-old']);
    expect(items[0]).toMatchObject({ currentStep: null, overdue: false });
    expect(total).toBe(2);
  });

  it('pages, and says how many there are across pages', () => {
    const page = breachList(rows, rows, { ...query, page: 2, limit: 2 }, clock);
    expect(page.items.map((item) => item.id)).toEqual(['fresh']);
    expect(page).toMatchObject({ total: 3, page: 2, pageSize: 2 });
  });

  it('narrows to the search, while the counts stay whole', () => {
    const result = breachList([rows[0]!], rows, query, clock);
    expect(result.items.map((item) => item.id)).toEqual(['fresh']);
    expect(result.total).toBe(1);
    expect(result.counts.open).toBe(3);
  });
});
