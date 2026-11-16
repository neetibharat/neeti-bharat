import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.validation';
import type { InvitationService } from '../../invitations/services/invitation.service';
import type { UserService } from '../../users/services/user.service';
import { AccessPolicyService } from './access-policy.service';
import type { InvitedMembersService } from './invited-members.service';

interface Setup {
  userCount: number;
  existing?: boolean;
  invited?: boolean;
  owner?: string;
}

function build({ userCount, existing, invited, owner }: Setup) {
  const users = {
    countAll: vi.fn().mockResolvedValue(userCount),
    findAnywhere: vi.fn().mockResolvedValue(existing ? { id: 'u', email: 'x' } : null),
    findById: vi.fn(async (id: string) =>
      id === 'u1' ? { id: 'u1', email: 'new@company.in', name: 'New' } : null,
    ),
  } as unknown as UserService;
  const invitations = {
    findOpenAnywhere: vi.fn().mockResolvedValue(invited ? [{ id: 'i1' }] : []),
  } as unknown as InvitationService;
  const members = {
    join: vi.fn().mockResolvedValue(undefined),
  } as unknown as InvitedMembersService;
  const config = {
    get: () => owner,
  } as unknown as ConfigService<Env, true>;
  return { service: new AccessPolicyService(users, invitations, members, config), members };
}

describe('AccessPolicyService.decide', () => {
  it('lets only the configured address claim a new install', async () => {
    const { service } = build({ userCount: 0, owner: 'Owner@company.in' });
    expect(await service.decide('owner@company.in')).toEqual({ allowed: true });
    expect(await service.decide('stranger@x.in')).toEqual({ allowed: false });
  });

  it('lets the first person in when no address is configured', async () => {
    const { service } = build({ userCount: 0 });
    expect(await service.decide('first@company.in')).toEqual({ allowed: true });
  });

  it('lets in anyone who already has an account, whichever organisations they belong to', async () => {
    const { service } = build({ userCount: 3, existing: true });
    expect(await service.decide('known@company.in')).toEqual({ allowed: true });
  });

  it('lets in someone invited to any organisation', async () => {
    const { service } = build({ userCount: 3, invited: true });
    expect(await service.decide('new@company.in')).toEqual({ allowed: true });
  });

  it('turns away someone with no account and no invitation', async () => {
    const { service } = build({ userCount: 3 });
    expect(await service.decide('stranger@x.in')).toEqual({ allowed: false });
  });
});

describe('AccessPolicyService.joinInvitedFor', () => {
  it('hands the person to the service that takes up invitations', async () => {
    const { service, members } = build({ userCount: 1 });
    await service.joinInvitedFor('u1');
    expect(members.join).toHaveBeenCalledWith({ id: 'u1', email: 'new@company.in', name: 'New' });
  });

  it('does nothing for an account that no longer exists', async () => {
    const { service, members } = build({ userCount: 1 });
    await service.joinInvitedFor('gone');
    expect(members.join).not.toHaveBeenCalled();
  });
});
