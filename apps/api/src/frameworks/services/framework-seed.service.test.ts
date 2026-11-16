import { describe, expect, it, vi } from 'vitest';
import type { FrameworkSeedRepository } from '../repositories/framework-seed.repository';
import type { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import { FrameworkSeedService } from './framework-seed.service';

function build(
  controlIds: string[],
  policyIds: string[],
  proofIds: string[] = [],
  requirementIds: string[] = [],
  frameworkIds: string[] = [],
) {
  const repository = {
    existingIds: vi.fn().mockResolvedValue({
      frameworkIds: new Set(frameworkIds),
      requirementIds: new Set(requirementIds),
      controlIds: new Set(controlIds),
      policyIds: new Set(policyIds),
      proofIds: new Set(proofIds),
    }),
    insert: vi.fn().mockResolvedValue(undefined),
  } as unknown as FrameworkSeedRepository;
  const organizations = {
    allIds: vi.fn().mockResolvedValue([]),
  } as unknown as OrganizationRepository;
  return { service: new FrameworkSeedService(repository, organizations), repository };
}

describe('FrameworkSeedService', () => {
  it('fills an empty database from the catalogue', async () => {
    const { service, repository } = build([], []);
    await service.seed();
    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ controls: expect.any(Array), policies: expect.any(Array) }),
    );
    const rows = vi.mocked(repository.insert).mock.calls[0]![0];
    expect(rows.controls).toHaveLength(47);
    expect(rows.policies).toHaveLength(18);
  });

  it('does nothing once everything is stored', async () => {
    const first = build([], []);
    await first.service.seed();
    const stored = vi.mocked(first.repository.insert).mock.calls[0]![0];
    const { service, repository } = build(
      stored.controls.map((row) => row.id),
      stored.policies.map((row) => row.id),
      stored.proofRequirements.map((row) => row.id),
      stored.requirements.map((row) => row.id),
      stored.frameworks.map((row) => row.id),
    );
    await service.seed();
    expect(repository.insert).not.toHaveBeenCalled();
  });
});
