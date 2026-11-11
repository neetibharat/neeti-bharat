import { describe, expect, it } from 'vitest';
import {
  POLICY_STATUSES,
  POLICY_TRANSITIONS,
  reviewDueAt,
  transitionNeedsAdmin,
} from './policy-status.js';

describe('policy status moves', () => {
  it('lets every status move somewhere, and never to itself', () => {
    for (const status of POLICY_STATUSES) {
      expect(POLICY_TRANSITIONS[status].length).toBeGreaterThan(0);
      expect(POLICY_TRANSITIONS[status]).not.toContain(status);
    }
  });

  it('only lets a policy be approved from review', () => {
    expect(POLICY_TRANSITIONS.draft).not.toContain('approved');
    expect(POLICY_TRANSITIONS.in_review).toContain('approved');
  });

  it('lets anyone ask for approval but keeps the decision with an admin', () => {
    expect(transitionNeedsAdmin('draft', 'in_review')).toBe(false);
    expect(transitionNeedsAdmin('in_review', 'approved')).toBe(true);
    expect(transitionNeedsAdmin('in_review', 'draft')).toBe(true);
    expect(transitionNeedsAdmin('approved', 'draft')).toBe(true);
  });
});

describe('reviewDueAt', () => {
  it('is a year after approval', () => {
    expect(reviewDueAt(new Date('2026-11-10T09:30:00.000Z')).toISOString()).toBe(
      '2027-11-10T09:30:00.000Z',
    );
  });
});
