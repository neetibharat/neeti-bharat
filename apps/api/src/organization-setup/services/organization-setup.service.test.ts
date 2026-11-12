import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { organizationIdOrNull } from '../../core/org/org-context';
import type { FrameworkSeedService } from '../../frameworks/services/framework-seed.service';
import type { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import type { PeopleService } from '../../people/services/people.service';
import { OrganizationSetupService } from './organization-setup.service';

const founder = { id: 'u1', email: 'asha@acme.in', name: 'Asha' };

function build() {
  const seenIn: (string | undefined)[] = [];
  const organizations = {
    createWithAdmin: vi.fn().mockResolvedValue({ id: 'org-new', name: 'Acme' }),
  } as unknown as OrganizationRepository;
  const seed = {
    seed: vi.fn(async () => void seenIn.push(organizationIdOrNull())),
  } as unknown as FrameworkSeedService;
  const people = {
    ensureForAccount: vi.fn(async () => void seenIn.push(organizationIdOrNull())),
  } as unknown as PeopleService;
  const activity = {
    record: vi.fn(async () => void seenIn.push(organizationIdOrNull())),
  } as unknown as ActivityService;
  const service = new OrganizationSetupService(organizations, seed, people, activity);
  return { service, organizations, seed, people, activity, seenIn };
}

describe('OrganizationSetupService.create', () => {
  it('makes the organisation, its first admin, its checklist and the first line of its log', async () => {
    const { service, organizations, seed, people, activity } = build();

    const result = await service.create('Acme', founder);

    expect(result).toEqual({ id: 'org-new', name: 'Acme', role: 'admin', onboarded: false });
    expect(organizations.createWithAdmin).toHaveBeenCalledWith('Acme', 'u1');
    expect(seed.seed).toHaveBeenCalled();
    expect(people.ensureForAccount).toHaveBeenCalledWith({ email: 'asha@acme.in', name: 'Asha' });
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ORGANIZATION_CREATED',
        actor: { id: 'u1', label: 'Asha' },
        subject: { type: 'organization', id: 'org-new' },
        details: { name: 'Acme' },
      }),
    );
  });

  it('does all the setting up as the new organisation, not as any other', async () => {
    const { service, seenIn } = build();
    await service.create('Acme', founder);
    expect(seenIn).toEqual(['org-new', 'org-new', 'org-new']);
  });
});
