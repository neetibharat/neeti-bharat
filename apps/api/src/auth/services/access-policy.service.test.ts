import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.validation';
import type { ActivityService } from '../../activity/services/activity.service';
import type { InvitationService } from '../../invitations/services/invitation.service';
import type { Account } from '../../users/repositories/user.repository';
import type { UserService } from '../../users/services/user.service';
import type { PeopleService } from '../../people/services/people.service';
import { AccessPolicyService } from './access-policy.service';

interface Setup {
  userCount: number;
  account?: Partial<Account>;
  invitationRole?: 'admin' | 'member' | 'auditor';
  owner?: string;
}

function build({ userCount, account, invitationRole, owner }: Setup) {
  const found = account
    ? { id: 'u', email: 'x', role: 'member', disabledAt: null, ...account }
    : null;
  const users = {
    count: vi.fn().mockResolvedValue(userCount),
    findByEmail: vi.fn().mockResolvedValue(found),
    isDisabled: vi.fn().mockResolvedValue(Boolean(account?.disabledAt)),
  } as unknown as UserService;
  const invitations = {
    findOpenByEmail: vi.fn().mockResolvedValue(invitationRole ? { role: invitationRole } : null),
    markAccepted: vi.fn().mockResolvedValue(undefined),
  } as unknown as InvitationService;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const people = {
    ensureForAccount: vi.fn().mockResolvedValue(undefined),
  } as unknown as PeopleService;
  return {
    service: new AccessPolicyService(users, invitations, activity, people, {
      get: () => owner,
    } as unknown as ConfigService<Env, true>),
    invitations,
    activity,
    people,
  };
}

describe('AccessPolicyService.decide', () => {
  it('lets only the configured address claim a new install', async () => {
    const { service } = build({ userCount: 0, owner: 'Owner@company.in' });
    expect(await service.decide('owner@company.in')).toMatchObject({
      allowed: true,
      role: 'admin',
    });
    expect(await service.decide('stranger@x.in')).toEqual({ allowed: false });
  });

  it('makes the first person an admin', async () => {
    const { service } = build({ userCount: 0 });
    expect(await service.decide('first@company.in')).toEqual({
      allowed: true,
      role: 'admin',
      isNewUser: true,
    });
  });

  it('lets an existing account in again, with the role it already has', async () => {
    const { service } = build({ userCount: 3, account: { role: 'auditor' } });
    expect(await service.decide('me@company.in')).toEqual({
      allowed: true,
      role: 'auditor',
      isNewUser: false,
    });
  });

  it('turns away someone who has left, even though their account still exists', async () => {
    const { service } = build({ userCount: 3, account: { disabledAt: new Date() } });
    expect(await service.decide('gone@company.in')).toEqual({ allowed: false });
  });

  it('lets an invited person in with the invited role', async () => {
    const { service } = build({ userCount: 3, invitationRole: 'auditor' });
    expect(await service.decide('new@company.in')).toEqual({
      allowed: true,
      role: 'auditor',
      isNewUser: true,
    });
  });

  it('turns away someone with no account and no invitation', async () => {
    const { service } = build({ userCount: 3 });
    expect(await service.decide('stranger@company.in')).toEqual({ allowed: false });
  });
});

describe('AccessPolicyService.isDisabled', () => {
  it('reports whether an account has been switched off', async () => {
    const off = build({ userCount: 1, account: { disabledAt: new Date() } });
    const on = build({ userCount: 1, account: {} });
    expect(await off.service.isDisabled('u')).toBe(true);
    expect(await on.service.isDisabled('u')).toBe(false);
  });
});

describe('AccessPolicyService.onUserCreated', () => {
  const user = { id: 'u1', email: 'new@company.in', name: 'New Person', role: 'member' };

  it('makes sure the new account is also a person', async () => {
    const { service, people } = build({ userCount: 3 });
    await service.onUserCreated(user);
    expect(people.ensureForAccount).toHaveBeenCalledWith({
      email: 'new@company.in',
      name: 'New Person',
    });
  });

  it('closes the open invitation', async () => {
    const { service, invitations } = build({ userCount: 3 });
    await service.onUserCreated(user);
    expect(invitations.markAccepted).toHaveBeenCalledWith('new@company.in');
  });

  it('records the new account, naming the person themselves as the actor', async () => {
    const { service, activity } = build({ userCount: 3 });
    await service.onUserCreated(user);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: { id: 'u1', label: 'new@company.in' },
        action: 'USER_CREATED',
        details: { email: 'new@company.in', role: 'member' },
      }),
    );
  });
});
