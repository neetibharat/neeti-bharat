import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { organizationIdOrNull } from '../../core/org/org-context';
import type { InvitationService } from '../../invitations/services/invitation.service';
import type { MembershipRepository } from '../../organizations/repositories/membership.repository';
import type { PeopleService } from '../../people/services/people.service';
import { InvitedMembersService } from './invited-members.service';

type Invite = { id: string; organizationId: string; role: 'admin' | 'member' | 'auditor' };

const account = { id: 'u1', email: 'new@company.in', name: 'New Person' };

function build(invitations: Invite[] = []) {
  const seenIn: (string | undefined)[] = [];
  const invitationService = {
    findOpenAnywhere: vi.fn().mockResolvedValue(invitations),
    markAccepted: vi.fn().mockResolvedValue(undefined),
  } as unknown as InvitationService;
  const memberships = {
    join: vi.fn().mockResolvedValue(undefined),
  } as unknown as MembershipRepository;
  const people = {
    ensureForAccount: vi.fn(async () => void seenIn.push(organizationIdOrNull())),
  } as unknown as PeopleService;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const service = new InvitedMembersService(invitationService, memberships, people, activity);
  return { service, invitations: invitationService, memberships, people, activity, seenIn };
}

describe('InvitedMembersService.join', () => {
  it('does nothing for someone nobody has invited', async () => {
    const { service, memberships } = build();
    await service.join(account);
    expect(memberships.join).not.toHaveBeenCalled();
  });

  it('makes them a member of each organisation that invited them, with the role it gave', async () => {
    const { service, memberships, people, invitations } = build([
      { id: 'i1', organizationId: 'o1', role: 'auditor' },
      { id: 'i2', organizationId: 'o2', role: 'admin' },
    ]);
    await service.join(account);

    expect(memberships.join).toHaveBeenCalledWith('o1', 'u1', 'auditor');
    expect(memberships.join).toHaveBeenCalledWith('o2', 'u1', 'admin');
    expect(people.ensureForAccount).toHaveBeenCalledTimes(2);
    expect(invitations.markAccepted).toHaveBeenCalledWith('i1');
    expect(invitations.markAccepted).toHaveBeenCalledWith('i2');
  });

  it('adds them as a person in each organisation, working as that organisation', async () => {
    const { service, seenIn } = build([
      { id: 'i1', organizationId: 'o1', role: 'member' },
      { id: 'i2', organizationId: 'o2', role: 'member' },
    ]);
    await service.join(account);
    expect(seenIn).toEqual(['o1', 'o2']);
  });

  it('records the new member in the log, naming the person themselves as the actor', async () => {
    const { service, activity } = build([{ id: 'i1', organizationId: 'o1', role: 'member' }]);
    await service.join(account);
    expect(activity.record).toHaveBeenCalledWith({
      actor: { id: 'u1', label: 'new@company.in' },
      action: 'USER_CREATED',
      subject: { type: 'user', id: 'u1' },
      details: { email: 'new@company.in', role: 'member' },
    });
  });
});
