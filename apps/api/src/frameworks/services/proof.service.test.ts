import { describe, expect, it, vi } from 'vitest';
import { AppException } from '../../core/common/app.exception';
import type { ActivityService } from '../../activity/services/activity.service';
import type { ControlRepository } from '../repositories/control.repository';
import type { PersonDirectory } from '../../people/services/person-directory';
import type { ProofRequirementRepository } from '../repositories/proof-requirement.repository';
import { ProofService } from './proof.service';
import type { FrameworksService } from './frameworks.service';

const actor = { id: 'u1', label: 'Asha' };
const input = {
  title: 'Key rotation log',
  description: 'Show each rotation.',
  frequency: 'quarterly' as const,
  assigneeId: null,
  dueDate: null,
};

function build(
  control: unknown = { id: 'DPDP-R6-01', title: 'Encryption', archivedAt: null },
  requirement: unknown = null,
) {
  const controls = {
    findOne: vi.fn().mockResolvedValue(control),
    idsCoveredBy: vi.fn().mockResolvedValue(new Set<string>()),
  } as unknown as ControlRepository;
  const requirements = {
    findOne: vi.fn().mockResolvedValue(requirement),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    archive: vi.fn().mockResolvedValue({}),
    restore: vi.fn().mockResolvedValue({}),
  } as unknown as ProofRequirementRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const frameworks = {
    proofItems: vi.fn().mockResolvedValue([]),
  } as unknown as FrameworksService;
  const directory = {
    activePeople: vi.fn().mockResolvedValue([{ id: 'p1', name: 'Ravi' }]),
    requireActive: vi.fn(async (id: string) => {
      const person = [{ id: 'p1', name: 'Ravi' }].find((p) => p.id === id);
      if (!person) throw new AppException('VALIDATION_FAILED', 400);
      return person;
    }),
  } as unknown as PersonDirectory;
  return {
    service: new ProofService(controls, requirements, activity, frameworks, directory),
    requirements,
    activity,
    frameworks,
    controls,
  };
}

const existing = { id: 'PR-P05-01', controlId: 'DPDP-R6-01', title: 'TLS scan', archivedAt: null };

describe('ProofService', () => {
  it('adds a requirement of the company own to a control, with a generated id, and records it', async () => {
    const { service, requirements, activity } = build();
    await service.create('DPDP-R6-01', input, actor);
    expect(requirements.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^custom-/),
        controlId: 'DPDP-R6-01',
        ...input,
      }),
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROOF_REQUIREMENT_ADDED',
        details: expect.objectContaining({ proof: 'Key rotation log' }),
      }),
    );
  });

  it('changes a requirement and records it', async () => {
    const { service, requirements, activity } = build(undefined, existing);
    await service.save('PR-P05-01', input, actor);
    expect(requirements.update).toHaveBeenCalledWith('PR-P05-01', { ...input, dueDate: null });
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROOF_REQUIREMENT_EDITED' }),
    );
  });

  it('archives a requirement and records it', async () => {
    const { service, requirements, activity } = build(undefined, existing);
    await service.archive('PR-P05-01', actor);
    expect(requirements.archive).toHaveBeenCalledWith('PR-P05-01');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROOF_REQUIREMENT_ARCHIVED' }),
    );
  });

  it('keeps the person and the due date, and refuses a person who is not here', async () => {
    const { service, requirements } = build();
    await service.create(
      'DPDP-R6-01',
      { ...input, assigneeId: 'p1', dueDate: '2027-03-31' },
      actor,
    );
    expect(requirements.create).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeId: 'p1', dueDate: new Date('2027-03-31T00:00:00.000Z') }),
    );
    await expect(
      build().service.create('DPDP-R6-01', { ...input, assigneeId: 'gone' }, actor),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('restores an archived requirement and records it, but not one that is not archived', async () => {
    const { service, requirements, activity } = build(undefined, {
      ...existing,
      archivedAt: new Date(),
    });
    await service.restore('PR-P05-01', actor);
    expect(requirements.restore).toHaveBeenCalledWith('PR-P05-01');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROOF_REQUIREMENT_RESTORED' }),
    );
    await expect(
      build(undefined, existing).service.restore('PR-P05-01', actor),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('refuses a control or requirement that is missing or archived', async () => {
    await expect(build(null).service.create('x', input, actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(
      build({ id: 'c', title: 't', archivedAt: new Date() }).service.create('c', input, actor),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(build(undefined, null).service.save('nope', input, actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(
      build(undefined, { ...existing, archivedAt: new Date() }).service.archive('PR-P05-01', actor),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('gives one page of the overview, with counts', async () => {
    const result = await build().service.overview({ tab: 'all', page: 1, limit: 25 });
    expect(result).toMatchObject({ items: [], total: 0, page: 1, pageSize: 25 });
    expect(result.counts.all).toBe(0);
  });

  it('narrows the overview to the proof of the controls a policy covers', async () => {
    const item = (id: string, controlId: string) => ({
      id,
      title: id,
      frequency: 'yearly',
      status: 'missing',
      controlId,
      controlTitle: controlId,
      ruleId: 'R6',
      ownerRole: 'DPO',
      ownerName: null,
      assigneeId: null,
      assigneeName: null,
      dueOn: null,
      overdue: false,
    });
    const { service, frameworks, controls } = build();
    vi.mocked(frameworks.proofItems).mockResolvedValue([
      item('PR-P05-01', 'DPDP-R6-01'),
      item('PR-P06-01', 'DPDP-R6-04'),
    ] as never);
    vi.mocked(controls.idsCoveredBy).mockResolvedValue(new Set(['DPDP-R6-01']));
    const result = await service.overview({ tab: 'all', page: 1, limit: 25, policyId: 'P05' });
    expect(controls.idsCoveredBy).toHaveBeenCalledWith('P05');
    expect(result.items.map((row) => row.id)).toEqual(['PR-P05-01']);
    expect(result.counts.all).toBe(1);
  });
});
