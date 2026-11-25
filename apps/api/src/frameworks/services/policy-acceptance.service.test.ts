import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { PersonDirectory } from '../../people/services/person-directory';
import type { PolicyAcceptanceRepository } from '../repositories/policy-acceptance.repository';
import { PolicyAcceptanceService } from './policy-acceptance.service';

const actor = { id: 'u1', label: 'Asha' };
const now = new Date('2026-11-20T10:30:00.000Z');
const user = { email: 'asha@example.com' };
const approved = { id: 'P1', title: 'Privacy', summary: 's', approvedAt: new Date('2026-10-01') };

function build(
  found: typeof approved | null = approved,
  me: { id: string; name: string } | null = { id: 'p1', name: 'Asha' },
) {
  const acceptances = {
    approved: vi.fn().mockResolvedValue(found ? [found] : []),
    findApproved: vi.fn().mockResolvedValue(found),
    ofPeople: vi.fn().mockResolvedValue([]),
    accept: vi.fn().mockResolvedValue({}),
  } as unknown as PolicyAcceptanceRepository;
  const directory = { findByEmail: vi.fn().mockResolvedValue(me) } as unknown as PersonDirectory;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  return {
    service: new PolicyAcceptanceService(acceptances, directory, activity),
    acceptances,
    activity,
  };
}

describe('PolicyAcceptanceService.accept', () => {
  it('records the acceptance for the signed-in person and logs it', async () => {
    const { service, acceptances, activity } = build();
    await service.accept('P1', user, actor, now);
    expect(acceptances.accept).toHaveBeenCalledWith('P1', 'p1', now);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'POLICY_ACCEPTED',
        details: { policyId: 'P1', title: 'Privacy' },
      }),
    );
  });

  it('refuses a policy that is not approved', async () => {
    const { service, acceptances } = build(null);
    await expect(service.accept('P1', user, actor, now)).rejects.toMatchObject({ status: 409 });
    expect(acceptances.accept).not.toHaveBeenCalled();
  });

  it('refuses a user who has no person at the company', async () => {
    const { service } = build(approved, null);
    await expect(service.accept('P1', user, actor, now)).rejects.toMatchObject({ status: 403 });
  });
});
