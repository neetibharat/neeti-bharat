import { describe, expect, it } from 'vitest';
import { signInErrorCode } from './sign-in-error';

describe('signInErrorCode', () => {
  it('has nothing to say when there is no error', () => {
    expect(signInErrorCode()).toBeUndefined();
    expect(signInErrorCode('')).toBeUndefined();
  });

  it('passes on one of our own codes', () => {
    expect(signInErrorCode('INVITATION_REQUIRED')).toBe('INVITATION_REQUIRED');
    expect(signInErrorCode('RATE_LIMITED')).toBe('RATE_LIMITED');
  });

  it('reads a refused new account as a missing invitation', () => {
    expect(signInErrorCode('unable_to_create_user')).toBe('INVITATION_REQUIRED');
  });

  it('calls anything else a general failure', () => {
    expect(signInErrorCode('access_denied')).toBe('INTERNAL');
  });
});
