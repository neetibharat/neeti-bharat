import { describe, expect, it } from 'vitest';
import { requestBoard, toBoardCard } from './request-board';
import type { RequestSummaryRow } from './request-view';

const NOW = new Date('2026-11-10T12:00:00Z');
const DAY = 86_400_000;

const row = (number: number, over: Partial<RequestSummaryRow> = {}) =>
  ({
    id: `r${number}`,
    number,
    type: 'erasure',
    personName: `Person ${number}`,
    receivedAt: new Date(NOW.getTime() - DAY),
    dueAt: new Date(NOW.getTime() + 5 * DAY),
    status: 'new',
    closedAt: null,
    assignee: null,
    tasks: [],
    ...over,
  }) as RequestSummaryRow;

describe('toBoardCard', () => {
  it('carries only what a card shows', () => {
    expect(toBoardCard(row(12), NOW)).toEqual({
      id: 'r12',
      number: 12,
      type: 'erasure',
      personName: 'Person 12',
      status: 'new',
      dueAt: new Date(NOW.getTime() + 5 * DAY).toISOString(),
      overdue: false,
      closedAt: null,
      closedOnTime: null,
      assigneeName: null,
    });
  });

  it('carries the name of whoever deals with it, not the id', () => {
    const card = toBoardCard(row(4, { assignee: { id: 'p1', name: 'Meera Shah' } }), NOW);
    expect(card.assigneeName).toBe('Meera Shah');
    expect(card).not.toHaveProperty('assigneeId');
  });

  it('marks an open request past its due date as overdue', () => {
    const late = row(1, { dueAt: new Date(NOW.getTime() - DAY) });
    expect(toBoardCard(late, NOW)).toMatchObject({ overdue: true, closedOnTime: null });
  });

  it('says whether a done request closed by its due date, and never calls it overdue', () => {
    const closedAt = new Date(NOW.getTime() - 2 * DAY);
    const onTime = row(2, { status: 'done', closedAt, dueAt: new Date(NOW.getTime() - DAY) });
    const late = row(3, { status: 'done', closedAt, dueAt: new Date(NOW.getTime() - 3 * DAY) });
    expect(toBoardCard(onTime, NOW)).toMatchObject({ closedOnTime: true, overdue: false });
    expect(toBoardCard(late, NOW)).toMatchObject({ closedOnTime: false, overdue: false });
  });
});

describe('requestBoard', () => {
  it('keeps each column in the order the database gave and passes the counts through', () => {
    const counts = { new: 9, in_progress: 1, done: 4, overdue: 2 };
    const board = requestBoard(
      { new: [row(5), row(3)], in_progress: [row(4, { status: 'in_progress' })], done: [] },
      counts,
      NOW,
    );
    expect(board.new.map((card) => card.number)).toEqual([5, 3]);
    expect(board.in_progress).toHaveLength(1);
    expect(board.done).toEqual([]);
    expect(board.counts).toBe(counts);
  });
});
