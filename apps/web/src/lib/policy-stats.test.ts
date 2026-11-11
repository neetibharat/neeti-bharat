import type { PolicyResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { countsByOwner, statusCounts } from './policy-stats';

const policy = (ownerRole: string, status: string) =>
  ({ ownerRole, status }) as unknown as PolicyResponse;

const policies = [
  policy('DPO', 'approved'),
  policy('DPO', 'draft'),
  policy('DPO', 'draft'),
  policy('SECURITY_LEAD', 'in_review'),
];

describe('policy stats', () => {
  it('counts the policies in each status', () => {
    expect(statusCounts(policies)).toEqual({ draft: 2, in_review: 1, approved: 1 });
  });

  it('counts each owner by status, the busiest first', () => {
    expect(countsByOwner(policies)).toEqual([
      { role: 'DPO', draft: 2, in_review: 0, approved: 1, total: 3 },
      { role: 'SECURITY_LEAD', draft: 0, in_review: 1, approved: 0, total: 1 },
    ]);
  });

  it('is all zero with no policies', () => {
    expect(statusCounts([])).toEqual({ draft: 0, in_review: 0, approved: 0 });
    expect(countsByOwner([])).toEqual([]);
  });
});
