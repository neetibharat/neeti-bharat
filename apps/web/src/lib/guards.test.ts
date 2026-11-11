import { describe, expect, it } from 'vitest';
import {
  isAppRole,
  isControlStatus,
  isJobRole,
  isProfileKey,
  isIdentityKey,
  isReviewCadence,
} from './guards';

describe('guards', () => {
  it('accept values from the list', () => {
    expect(isAppRole('admin')).toBe(true);
    expect(isJobRole('DPO')).toBe(true);
    expect(isControlStatus('done')).toBe(true);
    expect(isProfileKey('companyName')).toBe(true);
    expect(isReviewCadence('annual')).toBe(true);
    expect(isIdentityKey('website')).toBe(true);
  });

  it('reject anything else, including values that are not strings', () => {
    expect(isAppRole('root')).toBe(false);
    expect(isJobRole(undefined)).toBe(false);
    expect(isControlStatus(3)).toBe(false);
    expect(isProfileKey('custom:abc')).toBe(false);
    expect(isReviewCadence('monthly')).toBe(false);
    expect(isIdentityKey('hostingRegion')).toBe(false);
  });
});
