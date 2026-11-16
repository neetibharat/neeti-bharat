import { describe, expect, it } from 'vitest';
import {
  listOrder,
  listWhere,
  numberOfSearch,
  requestCounts,
  requestListPage,
} from './request-list';
import type { RequestSummaryRow } from './request-view';

const NOW = new Date('2026-11-10T12:00:00Z');
const DAY = 86_400_000;

const row = (id: string, dueInDays: number, over: Partial<RequestSummaryRow> = {}) =>
  ({
    id,
    number: 1,
    closedAt: null,
    type: 'access',
    personName: `Person ${id}`,
    receivedAt: new Date(NOW.getTime() - DAY),
    dueAt: new Date(NOW.getTime() + dueInDays * DAY),
    status: 'new',
    tasks: [],
    ...over,
  }) as RequestSummaryRow;

describe('listWhere', () => {
  it('matches the tab and nothing else when no type or search is given', () => {
    expect(listWhere({ tab: 'new' })).toEqual({ status: 'new' });
  });

  it('adds the type and searches name, email and details', () => {
    const where = listWhere({ tab: 'done', type: 'erasure', q: 'asha' });
    expect(where).toMatchObject({ status: 'done', type: 'erasure' });
    const clauses = 'OR' in where ? (where.OR ?? []) : [];
    expect(clauses.map((clause) => Object.keys(clause)[0])).toEqual([
      'personName',
      'personEmail',
      'details',
    ]);
  });
});

describe('numberOfSearch', () => {
  it('reads REQ-12 and 12 as the number 12, in any case', () => {
    expect(numberOfSearch('REQ-12')).toBe(12);
    expect(numberOfSearch('req-12')).toBe(12);
    expect(numberOfSearch(' 12 ')).toBe(12);
  });

  it('leaves other text, and numbers too long for the column, to the text search', () => {
    expect(numberOfSearch('asha')).toBeNull();
    expect(numberOfSearch('REQ-')).toBeNull();
    expect(numberOfSearch('12 months')).toBeNull();
    expect(numberOfSearch('12345678901')).toBeNull();
  });
});

describe('listWhere with a number', () => {
  it('also matches the number when the search is one', () => {
    const where = listWhere({ tab: 'new', q: 'REQ-12' });
    const clauses = 'OR' in where ? (where.OR ?? []) : [];
    expect(clauses[0]).toEqual({ number: 12 });
    expect(clauses).toHaveLength(4);
  });
});

describe('listOrder', () => {
  it('puts the nearest due date first on open tabs and the latest closed first on done', () => {
    expect(listOrder('new')).toEqual([{ dueAt: 'asc' }, { number: 'asc' }]);
    expect(listOrder('in_progress')).toEqual([{ dueAt: 'asc' }, { number: 'asc' }]);
    expect(listOrder('done')).toEqual([{ closedAt: 'desc' }, { number: 'desc' }]);
  });
});

describe('requestCounts', () => {
  it('counts each status, with zero for one that has none', () => {
    const byStatus = [
      { status: 'new' as const, count: 3 },
      { status: 'done' as const, count: 2 },
    ];
    expect(requestCounts(byStatus, 1)).toEqual({ new: 3, in_progress: 0, done: 2, overdue: 1 });
  });
});

describe('requestListPage', () => {
  const counts = { new: 2, in_progress: 0, done: 0, overdue: 1 };

  it('sends only what the table shows, with overdue and task progress worked out', () => {
    const rows = [
      row('late', -2, { tasks: [{ outcome: 'done' }, { outcome: 'todo' }] }),
      row('soon', 3),
    ];
    const page = requestListPage(rows, 2, { page: 1, limit: 25 }, counts, NOW);
    expect(page).toMatchObject({ total: 2, page: 1, pageSize: 25, counts });
    expect(page.items[0]).toEqual({
      id: 'late',
      number: 1,
      type: 'access',
      personName: 'Person late',
      receivedAt: new Date(NOW.getTime() - DAY).toISOString(),
      dueAt: new Date(NOW.getTime() - 2 * DAY).toISOString(),
      status: 'new',
      overdue: true,
      tasksDone: 1,
      tasksTotal: 2,
      closedOnTime: null,
      assigneeName: null,
    });
    expect(page.items[1]).toMatchObject({ overdue: false, tasksDone: 0, tasksTotal: 0 });
  });

  it('never calls a done request overdue', () => {
    const page = requestListPage(
      [row('x', -5, { status: 'done' })],
      1,
      { page: 1, limit: 25 },
      counts,
      NOW,
    );
    expect(page.items[0]!.overdue).toBe(false);
  });
});
