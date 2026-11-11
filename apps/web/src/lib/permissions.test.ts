import { describe, expect, it } from 'vitest';
import { canEdit, isAdminUser, permissionsOf } from './permissions';

describe('permissions', () => {
  it('lets admins and members edit, and nobody else', () => {
    expect(canEdit({ role: 'admin' })).toBe(true);
    expect(canEdit({ role: 'member' })).toBe(true);
    expect(canEdit({ role: 'auditor' })).toBe(false);
    expect(canEdit(null)).toBe(false);
  });

  it('gives both answers at once, and nothing when nobody is signed in', () => {
    expect(permissionsOf({ role: 'admin' })).toEqual({ canEdit: true, isAdmin: true });
    expect(permissionsOf({ role: 'member' })).toEqual({ canEdit: true, isAdmin: false });
    expect(permissionsOf({ role: 'auditor' })).toEqual({ canEdit: false, isAdmin: false });
    expect(permissionsOf(null)).toEqual({ canEdit: false, isAdmin: false });
  });

  it('knows an admin', () => {
    expect(isAdminUser({ role: 'admin' })).toBe(true);
    expect(isAdminUser({ role: 'member' })).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });
});
