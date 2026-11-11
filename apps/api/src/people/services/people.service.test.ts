import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { UserService } from '../../users/services/user.service';
import type { Person } from '../../generated/prisma/client';
import type { InvitationService } from '../../invitations/services/invitation.service';
import type { PeopleRepository } from '../repositories/people.repository';
import { PeopleService } from './people.service';

const actor = { id: 'admin-1', label: 'Asha' };

function build({ emailTaken = false, inviteFails = false } = {}) {
  const created = {
    id: 'p1',
    name: 'Priya',
    email: 'priya@company.in',
    status: 'active',
    roles: [],
  };
  const people = {
    findByEmail: vi.fn().mockResolvedValue(emailTaken ? ({ id: 'old' } as Person) : null),
    create: vi.fn().mockResolvedValue(created),
    findWithRoles: vi.fn().mockResolvedValue(created),
    ensure: vi.fn().mockResolvedValue(created),
    findById: vi.fn().mockResolvedValue(created),
    update: vi.fn().mockResolvedValue(created),
  } as unknown as PeopleRepository;
  const users = { findByEmails: vi.fn().mockResolvedValue([]) } as unknown as UserService;
  const invitationService = {
    findOpenByEmails: vi.fn().mockResolvedValue([]),
    create: inviteFails
      ? vi.fn().mockRejectedValue(new Error('invite failed'))
      : vi.fn().mockResolvedValue({}),
  } as unknown as InvitationService;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const service = new PeopleService(people, users, invitationService, activity);
  return { service, people, invitationService, activity };
}

describe('PeopleService.add', () => {
  it('adds someone with no login, without sending any invitation', async () => {
    const { service, invitationService, activity } = build();
    await service.add({ name: 'Priya', email: 'Priya@Company.in', access: 'staff' }, actor);
    expect(invitationService.create).not.toHaveBeenCalled();
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PERSON_ADDED',
        details: { name: 'Priya', email: 'priya@company.in', access: 'staff' },
      }),
    );
  });

  it('stores only the fields a person has, never the access', async () => {
    const { service, people } = build();
    await service.add(
      { name: 'Priya', email: 'priya@company.in', department: 'Legal', access: 'member' },
      actor,
    );
    const [data] = vi.mocked(people.create).mock.calls[0]!;
    expect(Object.keys(data).sort()).toEqual(['department', 'email', 'jobTitle', 'name']);
  });

  it('invites them to sign in when they are given a login role', async () => {
    const { service, invitationService } = build();
    await service.add({ name: 'Priya', email: 'priya@company.in', access: 'auditor' }, actor);
    expect(invitationService.create).toHaveBeenCalledWith(
      { email: 'priya@company.in', role: 'auditor' },
      actor,
    );
  });

  it('keeps emails unique, ignoring capitals', async () => {
    const { service, people } = build({ emailTaken: true });
    await expect(
      service.add({ name: 'Priya', email: 'PRIYA@company.in', access: 'staff' }, actor),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(people.findByEmail).toHaveBeenCalledWith('priya@company.in');
    expect(people.create).not.toHaveBeenCalled();
  });

  it('fails as a whole when the invitation fails, so the request rolls back and nothing is logged', async () => {
    const { service, activity } = build({ inviteFails: true });
    await expect(
      service.add({ name: 'Priya', email: 'priya@company.in', access: 'member' }, actor),
    ).rejects.toThrow('invite failed');
    expect(activity.record).not.toHaveBeenCalled();
  });
});

describe('PeopleService.ensureForAccount', () => {
  it('uses the account name, or the start of the email when there is none', async () => {
    const { service, people } = build();
    await service.ensureForAccount({ email: 'a@company.in', name: 'Asha' });
    await service.ensureForAccount({ email: 'b@company.in', name: '' });
    expect(people.ensure).toHaveBeenNthCalledWith(1, { name: 'Asha', email: 'a@company.in' });
    expect(people.ensure).toHaveBeenNthCalledWith(2, { name: 'b', email: 'b@company.in' });
  });
});
