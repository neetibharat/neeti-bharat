import { describe, expect, it } from 'vitest';
import {
  isAppRole,
  isBreachStep,
  isControlStatus,
  isJobRole,
  isProfileKey,
  isRequestType,
  isTaskOutcome,
  isIdentityKey,
  isReviewCadence,
} from './guards';

describe('guards', () => {
  it('accept values from the list', () => {
    expect(isAppRole('admin')).toBe(true);
    expect(isJobRole('DPO')).toBe(true);
    expect(isBreachStep('tell_board')).toBe(true);
    expect(isRequestType('erasure')).toBe(true);
    expect(isTaskOutcome('kept_by_law')).toBe(true);
    expect(isControlStatus('done')).toBe(true);
    expect(isProfileKey('companyName')).toBe(true);
    expect(isReviewCadence('annual')).toBe(true);
    expect(isIdentityKey('website')).toBe(true);
  });

  it('reject anything else, including values that are not strings', () => {
    expect(isAppRole('root')).toBe(false);
    expect(isJobRole(undefined)).toBe(false);
    expect(isBreachStep('closed')).toBe(false);
    expect(isRequestType('delete')).toBe(false);
    expect(isTaskOutcome(undefined)).toBe(false);
    expect(isControlStatus(3)).toBe(false);
    expect(isProfileKey('custom:abc')).toBe(false);
    expect(isReviewCadence('monthly')).toBe(false);
    expect(isIdentityKey('hostingRegion')).toBe(false);
  });
});
