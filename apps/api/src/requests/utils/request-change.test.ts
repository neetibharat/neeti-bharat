import { describe, expect, it } from 'vitest';
import { detailsChanged } from './request-change';
import type { RequestRow } from './request-view';

const current = {
  type: 'access',
  personName: 'Ravi Kumar',
  personEmail: 'ravi@example.com',
  details: 'A copy please',
} as RequestRow;

describe('detailsChanged', () => {
  it('is false for the same details', () => {
    expect(detailsChanged(current, { ...current })).toBe(false);
  });

  it('is true when any detail differs', () => {
    expect(detailsChanged(current, { ...current, type: 'erasure' })).toBe(true);
    expect(detailsChanged(current, { ...current, personEmail: 'r@example.com' })).toBe(true);
    expect(detailsChanged(current, { ...current, details: 'Changed' })).toBe(true);
  });
});
