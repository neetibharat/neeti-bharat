import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { Person } from '../../generated/prisma/client';
import type { PeopleRepository } from '../repositories/people.repository';
import { RoleService } from './role.service';

const actor = { id: 'admin-1', label: 'Asha' };

interface Setup {
  holder?: { personId: string; person: { name: string } } | null;
  person?: Partial<Person> | null;
}

function build({ holder = null, person = {} }: Setup = {}) {
  const found =
    person === null ? null : ({ id: 'p2', name: 'Anil', status: 'active', ...person } as Person);
  const people = {
    findRoleHolding: vi.fn().mockResolvedValue(holder),
    findById: vi.fn().mockResolvedValue(found),
    assignRole: vi.fn().mockResolvedValue({}),
    clearRole: vi.fn().mockResolvedValue(undefined),
  } as unknown as PeopleRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  return { service: new RoleService(people, activity), people, activity };
}

describe('RoleService.assign', () => {
  it('gives a vacant role to a person, and records it', async () => {
    const { service, people, activity } = build();
    await service.assign('DPO', 'p2', actor);
    expect(people.assignRole).toHaveBeenCalledWith('DPO', 'p2', expect.any(Date));
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ROLE_ASSIGNED',
        details: { jobRole: 'DPO', name: 'Anil' },
      }),
    );
  });

  it('does nothing when the person already holds it', async () => {
    const { service, people, activity } = build({
      holder: { personId: 'p2', person: { name: 'Anil' } },
    });
    await service.assign('DPO', 'p2', actor);
    expect(people.assignRole).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('moves a role from one person to another', async () => {
    const { service, people } = build({ holder: { personId: 'p1', person: { name: 'Priya' } } });
    await service.assign('DPO', 'p2', actor);
    expect(people.assignRole).toHaveBeenCalledWith('DPO', 'p2', expect.any(Date));
  });

  it('refuses someone who has left, and someone who does not exist', async () => {
    await expect(
      build({ person: { status: 'left' } }).service.assign('DPO', 'p2', actor),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(build({ person: null }).service.assign('DPO', 'p2', actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('leaves a role vacant with null, naming who held it', async () => {
    const { service, people, activity } = build({
      holder: { personId: 'p1', person: { name: 'Priya' } },
    });
    await service.assign('DPO', null, actor);
    expect(people.clearRole).toHaveBeenCalledWith('DPO');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ROLE_UNASSIGNED',
        details: { jobRole: 'DPO', name: 'Priya' },
      }),
    );
  });

  it('does nothing when asked to vacate a role that is already vacant', async () => {
    const { service, people, activity } = build();
    await service.assign('DPO', null, actor);
    expect(people.clearRole).not.toHaveBeenCalled();
    expect(activity.record).not.toHaveBeenCalled();
  });
});
