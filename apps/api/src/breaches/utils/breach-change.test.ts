import { describe, expect, it } from 'vitest';
import { detailsChanged } from './breach-change';
import type { BreachRow } from './breach-view';

const foundAt = new Date('2026-11-10T08:00:00Z');
const current = {
  title: 'Export',
  description: 'Sent wrongly',
  foundAt,
  affectedSystems: 'Billing',
  affectedData: 'Emails',
  peopleAffected: 5,
} as BreachRow;
const same = { ...current, foundAt: new Date(foundAt) };

describe('detailsChanged', () => {
  it('is false for the same details, even as a new Date object', () => {
    expect(detailsChanged(current, same)).toBe(false);
  });

  it('is true when any detail differs', () => {
    expect(detailsChanged(current, { ...same, title: 'Other' })).toBe(true);
    expect(detailsChanged(current, { ...same, peopleAffected: null })).toBe(true);
    expect(detailsChanged(current, { ...same, foundAt: new Date('2026-11-10T09:00:00Z') })).toBe(
      true,
    );
  });
});
