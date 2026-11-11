import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { Account } from '../../users/repositories/user.repository';
import type { UserService } from '../../users/services/user.service';
import type { Person } from '../../generated/prisma/client';
import type { InvitationService } from '../../invitations/services/invitation.service';
import { AccessChangeService } from './access-change.service';
import type { PeopleRepository } from '../repositories/people.repository';

const actor = { id: 'admin-1', label: 'Asha' };

interface Setup {
  person?: Partial<Person> | null;
  account?: Partial<Account> | null;
  invitation?: { id: string; role: string } | null;
  activeAdmins?: number;
}

function build({ person = {}, account = null, invitation = null, activeAdmins = 2 }: Setup = {}) {
  const found =
    person === null
      ? null
      : ({
          id: 'p1',
          name: 'Priya',
          email: 'priya@company.in',
          status: 'active',
          ...person,
        } as Person);
  const people = {
    findById: vi.fn().mockResolvedValue(found),
    markLeft: vi.fn().mockResolvedValue({ roles: ['DPO'], assignments: 3 }),
  } as unknown as PeopleRepository;
  const users = {
    findByEmail: vi
      .fn()
      .mockResolvedValue(
        account ? { id: 'u1', role: 'member', disabledAt: null, ...account } : null,
      ),
    countActiveAdmins: vi.fn().mockResolvedValue(activeAdmins),
    setRole: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn().mockResolvedValue(undefined),
  } as unknown as UserService;
  const invitationService = {
    findOpenByEmail: vi.fn().mockResolvedValue(invitation),
    create: vi.fn().mockResolvedValue({}),
    revoke: vi.fn().mockResolvedValue(undefined),
  } as unknown as InvitationService;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const service = new AccessChangeService(people, users, invitationService, activity);
  return { service, people, users, invitationService, activity };
}

describe('AccessChangeService.setAccess', () => {
  it('changes the role of someone who has an account, and records it', async () => {
    const { service, users, activity } = build({ account: { role: 'member' } });
    await service.setAccess('p1', 'auditor', actor);
    expect(users.setRole).toHaveBeenCalledWith('u1', 'auditor');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ACCESS_CHANGED',
        details: { name: 'Priya', from: 'member', to: 'auditor' },
      }),
    );
  });

  it('does nothing when the access is already what was asked for', async () => {
    const { service, users, activity } = build({ account: { role: 'member' } });
    await service.setAccess('p1', 'member', actor);
    expect(users.setRole).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('switches off the login, and ends its sessions, when access becomes staff', async () => {
    const { service, users } = build({ account: { role: 'member' } });
    await service.setAccess('p1', 'staff', actor);
    expect(users.disable).toHaveBeenCalledWith('u1', expect.any(Date));
  });

  it('turns a login back on when a staff person gets access again', async () => {
    const { service, users } = build({ account: { role: 'member', disabledAt: new Date() } });
    await service.setAccess('p1', 'admin', actor);
    expect(users.setRole).toHaveBeenCalledWith('u1', 'admin');
  });

  it('will not demote or remove the last admin', async () => {
    const { service, users } = build({ account: { role: 'admin' }, activeAdmins: 1 });
    await expect(service.setAccess('p1', 'member', actor)).rejects.toMatchObject({
      code: 'LAST_ADMIN',
    });
    await expect(service.setAccess('p1', 'staff', actor)).rejects.toMatchObject({
      code: 'LAST_ADMIN',
    });
    expect(users.setRole).not.toHaveBeenCalled();
    expect(users.disable).not.toHaveBeenCalled();
  });

  it('lets an admin be demoted when another admin remains', async () => {
    const { service, users } = build({ account: { role: 'admin' }, activeAdmins: 2 });
    await service.setAccess('p1', 'member', actor);
    expect(users.setRole).toHaveBeenCalledWith('u1', 'member');
  });

  it('invites someone with no account yet when they are given access', async () => {
    const { service, invitationService } = build();
    await service.setAccess('p1', 'member', actor);
    expect(invitationService.create).toHaveBeenCalledWith(
      { email: 'priya@company.in', role: 'member' },
      actor,
    );
  });

  it('swaps an open invitation for a new one when the access changes before they sign in', async () => {
    const { service, invitationService } = build({ invitation: { id: 'inv-1', role: 'member' } });
    await service.setAccess('p1', 'admin', actor);
    expect(invitationService.revoke).toHaveBeenCalledWith('inv-1', actor);
    expect(invitationService.create).toHaveBeenCalledWith(
      { email: 'priya@company.in', role: 'admin' },
      actor,
    );
  });

  it('refuses to change someone who has left, and someone who does not exist', async () => {
    await expect(
      build({ person: { status: 'left' } }).service.setAccess('p1', 'member', actor),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      build({ person: null }).service.setAccess('p1', 'member', actor),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('AccessChangeService.leave', () => {
  it('cuts the login first, cancels any invitation, frees the roles, and records it', async () => {
    const { service, users, people, activity } = build({ account: { role: 'member' } });
    const result = await service.leave('p1', actor);
    expect(users.disable).toHaveBeenCalledWith('u1', expect.any(Date));
    expect(people.markLeft).toHaveBeenCalledWith('p1', expect.any(Date));
    expect(result).toEqual({ releasedRoles: ['DPO'], releasedAssignments: 3 });
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PERSON_LEFT' }),
    );
  });

  it('cancels an invitation that was never accepted', async () => {
    const { service, invitationService } = build({ invitation: { id: 'inv-1', role: 'member' } });
    await service.leave('p1', actor);
    expect(invitationService.revoke).toHaveBeenCalledWith('inv-1', actor);
  });

  it('will not let the last admin leave, and changes nothing', async () => {
    const { service, users, people } = build({ account: { role: 'admin' }, activeAdmins: 1 });
    await expect(service.leave('p1', actor)).rejects.toMatchObject({ code: 'LAST_ADMIN' });
    expect(users.disable).not.toHaveBeenCalled();
    expect(people.markLeft).not.toHaveBeenCalled();
  });

  it('does nothing for someone who has already left', async () => {
    const { service, users, activity } = build({ person: { status: 'left' } });
    expect(await service.leave('p1', actor)).toEqual({ releasedRoles: [], releasedAssignments: 0 });
    expect(users.disable).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });
});
