import { describe, expect, it } from 'vitest';
import { dueState } from './request-due';

const NOW = new Date('2026-11-10T12:00:00Z');
const inDays = (days: number) => new Date(NOW.getTime() + days * 86_400_000).toISOString();

describe('dueState', () => {
  it('is done for a request that is closed, even past its due date', () => {
    expect(dueState({ status: 'done', dueAt: inDays(-5) }, NOW)).toBe('done');
  });

  it('is overdue once the due date has passed', () => {
    expect(dueState({ status: 'new', dueAt: inDays(-0.01) }, NOW)).toBe('overdue');
    expect(dueState({ status: 'in_progress', dueAt: inDays(-20) }, NOW)).toBe('overdue');
  });

  it('is soon within a week and later after that', () => {
    expect(dueState({ status: 'new', dueAt: inDays(6.5) }, NOW)).toBe('soon');
    expect(dueState({ status: 'new', dueAt: inDays(7) }, NOW)).toBe('later');
    expect(dueState({ status: 'new', dueAt: inDays(60) }, NOW)).toBe('later');
  });
});
