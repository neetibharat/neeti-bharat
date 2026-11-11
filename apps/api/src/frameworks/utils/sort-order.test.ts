import { describe, expect, it } from 'vitest';
import { nextSortOrder } from './sort-order';

describe('nextSortOrder', () => {
  it('goes one after the highest', async () => {
    expect(await nextSortOrder(async () => ({ _max: { sortOrder: 4 } }))).toBe(5);
  });

  it('starts at 1 in an empty list', async () => {
    expect(await nextSortOrder(async () => ({ _max: { sortOrder: null } }))).toBe(1);
  });
});
