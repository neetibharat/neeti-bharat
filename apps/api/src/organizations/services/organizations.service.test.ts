import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { runInOrganization } from '../../core/org/org-context';
import type { MembershipRepository } from '../repositories/membership.repository';
import type { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationsService } from './organizations.service';

const actor = { id: 'u1', label: 'Asha' };

function build(changed = true, open: unknown[] = []) {
  const memberships = {
    findOpen: vi.fn().mockResolvedValue(open),
  } as unknown as MembershipRepository;
  const organizations = {
    markOnboarded: vi.fn().mockResolvedValue(changed),
  } as unknown as OrganizationRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  return {
    service: new OrganizationsService(memberships, organizations, activity),
    organizations,
    activity,
  };
}

describe('OrganizationsService.listFor', () => {
  it('lists each organisation with the role and whether set-up is over', async () => {
    const { service } = build(true, [
      { organizationId: 'o1', organizationName: 'Acme', role: 'admin', onboarded: true },
      { organizationId: 'o2', organizationName: 'Beta', role: 'auditor', onboarded: false },
    ]);
    expect(await service.listFor('u1')).toEqual({
      organizations: [
        { id: 'o1', name: 'Acme', role: 'admin', onboarded: true },
        { id: 'o2', name: 'Beta', role: 'auditor', onboarded: false },
      ],
    });
  });
});

describe('OrganizationsService.completeOnboarding', () => {
  it('marks the organisation being worked in and writes it to the log', async () => {
    const { service, organizations, activity } = build();
    await runInOrganization('o1', () => service.completeOnboarding(actor));
    expect(organizations.markOnboarded).toHaveBeenCalledWith('o1', expect.any(Date));
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ONBOARDING_COMPLETED',
        subject: { type: 'organization', id: 'o1' },
      }),
    );
  });

  it('writes nothing when set-up was already over', async () => {
    const { service, activity } = build(false);
    await runInOrganization('o1', () => service.completeOnboarding(actor));
    expect(activity.record).not.toHaveBeenCalled();
  });
});
