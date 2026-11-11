import { describe, expect, it } from 'vitest';
import { isAdmin } from './is-admin';

describe('isAdmin', () => {
  it('reads one role, several roles, and none', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('member,admin')).toBe(true);
    expect(isAdmin(['auditor', 'admin'])).toBe(true);
    expect(isAdmin('member')).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
