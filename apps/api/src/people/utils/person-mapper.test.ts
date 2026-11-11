import { describe, expect, it } from 'vitest';
import type { Account } from '../../users/repositories/user.repository';
import type { Invitation, RoleAssignment } from '../../generated/prisma/client';
import type { PersonWithRoles } from '../repositories/people.repository';
import { accessOf, toPersonResponses, toRoleHolders } from './person-mapper';

const account = (over: Partial<Account> = {}): Account => ({
  id: 'u1',
  email: 'a@company.in',
  role: 'member',
  disabledAt: null,
  ...over,
});
const invitation = (role: Invitation['role'] = 'member') => ({ role }) as Invitation;

describe('accessOf', () => {
  it('reads access from the account', () => {
    expect(accessOf(account({ role: 'admin' }))).toEqual({ access: 'admin', invited: false });
  });

  it('reads access from an open invitation when there is no account yet', () => {
    expect(accessOf(null, invitation('auditor'))).toEqual({ access: 'auditor', invited: true });
  });

  it('is staff when there is neither, or when the account has been disabled', () => {
    expect(accessOf()).toEqual({ access: 'staff', invited: false });
    expect(accessOf(account({ disabledAt: new Date() }))).toEqual({
      access: 'staff',
      invited: false,
    });
  });

  it('prefers the account over an invitation', () => {
    expect(accessOf(account({ role: 'member' }), invitation('admin'))).toEqual({
      access: 'member',
      invited: false,
    });
  });
});

describe('toPersonResponses', () => {
  const person = (id: string, email: string, roles: RoleAssignment[] = []): PersonWithRoles =>
    ({
      id,
      name: id,
      email,
      status: 'active',
      leftAt: null,
      department: null,
      jobTitle: null,
      roles,
    }) as PersonWithRoles;

  it('joins each person to their account and invitation by email', () => {
    const people = toPersonResponses(
      [person('p1', 'a@company.in'), person('p2', 'b@company.in'), person('p3', 'c@company.in')],
      [account({ email: 'a@company.in', role: 'admin' })],
      [{ email: 'b@company.in', role: 'member' } as Invitation],
    );
    expect(people.map((entry) => [entry.access, entry.invited])).toEqual([
      ['admin', false],
      ['member', true],
      ['staff', false],
    ]);
  });

  it('lists all nine job roles, vacant unless someone holds them', () => {
    const held = { role: 'DPO', personId: 'p1', since: new Date('2026-01-01') } as RoleAssignment;
    const roleHolders = toRoleHolders([held]);
    const people = toPersonResponses([person('p1', 'a@company.in', [held])], [], []);
    expect(roleHolders).toHaveLength(9);
    expect(roleHolders.find((entry) => entry.role === 'DPO')?.personId).toBe('p1');
    expect(roleHolders.find((entry) => entry.role === 'SECURITY_LEAD')?.personId).toBeNull();
    expect(people[0]!.roles).toEqual(['DPO']);
  });
});
