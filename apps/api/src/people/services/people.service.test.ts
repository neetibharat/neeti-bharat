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
    findPendingByEmails: vi.fn().mockResolvedValue([]),
    create: inviteFails
      ? vi.fn().mockRejectedValue(new Error('invite failed'))
      : vi.fn().mockResolvedValue({}),
    resend: vi.fn().mockResolvedValue({}),
  } as unknown as InvitationService;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const service = new PeopleService(people, users, invitationService, activity);
  return { service, people, invitationService, activity };
}

describe('PeopleService.add', () => {
  it('adds someone and invites them to sign in', async () => {
    const { service, invitationService, activity } = build();
    await service.add({ name: 'Priya', email: 'Priya@Company.in', access: 'member' }, actor);
    expect(invitationService.create).toHaveBeenCalledWith(
      { email: 'priya@company.in', role: 'member' },
      actor,
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PERSON_ADDED',
        details: { name: 'Priya', email: 'priya@company.in', access: 'member' },
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

  it('invites them with the role they were given', async () => {
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
      service.add({ name: 'Priya', email: 'PRIYA@company.in', access: 'member' }, actor),
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

describe('PeopleService.resendInvitation', () => {
  it('sends the invitation of that person again and returns them', async () => {
    const { service, invitationService } = build();
    const result = await service.resendInvitation('p1', actor);
    expect(invitationService.resend).toHaveBeenCalledWith('priya@company.in', actor);
    expect(result.id).toBe('p1');
  });

  it('refuses someone who has left, or who does not exist', async () => {
    const left = build();
    vi.mocked(left.people.findById).mockResolvedValueOnce({ id: 'p1', status: 'left' } as Person);
    await expect(left.service.resendInvitation('p1', actor)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    const none = build();
    vi.mocked(none.people.findById).mockResolvedValueOnce(null);
    await expect(none.service.resendInvitation('x', actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
