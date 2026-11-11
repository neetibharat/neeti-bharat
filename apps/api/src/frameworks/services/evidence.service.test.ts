import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { ControlRepository, ControlWithLinks } from '../repositories/control.repository';
import type { EvidenceRepository } from '../repositories/evidence.repository';
import type { ProofRequirementRepository } from '../repositories/proof-requirement.repository';
import { EvidenceService } from './evidence.service';

const actor = { id: 'u1', label: 'Asha' };

const control = (over: Partial<ControlWithLinks> = {}): ControlWithLinks =>
  ({ id: 'DPDP-R6-01', title: 'Encryption', archivedAt: null, ...over }) as ControlWithLinks;

const row = {
  id: 'e1',
  controlId: 'DPDP-R6-01',
  kind: 'link',
  title: 'Config export',
  url: 'https://example.com/x',
  note: null,
  addedByName: 'Asha',
  createdAt: new Date('2026-11-10T10:00:00Z'),
};

const requirement = (over: Record<string, unknown> = {}) => ({
  id: 'PR-P05-01',
  controlId: 'DPDP-R6-01',
  title: 'TLS scan',
  description: '',
  frequency: 'yearly',
  archivedAt: null,
  dueDate: null,
  assignee: null,
  evidence: [],
  ...over,
});

function build(found: ControlWithLinks | null = control(), requirements: unknown[] = []) {
  const controls = {
    findOne: vi.fn().mockResolvedValue(found),
  } as unknown as ControlRepository;
  const evidence = {
    findGeneral: vi.fn().mockResolvedValue([row]),
    findOne: vi.fn().mockResolvedValue(row),
    create: vi.fn().mockResolvedValue(row),
    delete: vi.fn().mockResolvedValue(row),
  } as unknown as EvidenceRepository;
  const requirementRepo = {
    findByControl: vi.fn().mockResolvedValue(requirements),
    findArchivedByControl: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(
      async (id: string) => (requirements as { id: string }[]).find((r) => r.id === id) ?? null,
    ),
  } as unknown as ProofRequirementRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  return {
    service: new EvidenceService(controls, evidence, requirementRepo, activity),
    evidence,
    activity,
  };
}

describe('EvidenceService.list', () => {
  it('lists the archived requirements and the general proof, and nothing else', async () => {
    const { service } = build(control(), []);
    const result = await service.list('DPDP-R6-01');
    expect(Object.keys(result).sort()).toEqual(['archived', 'other']);
    expect(result.other[0]).toMatchObject({ id: 'e1', kind: 'link', url: 'https://example.com/x' });
  });

  it('refuses a control that does not exist', async () => {
    await expect(build(null).service.list('x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('EvidenceService.add', () => {
  it('stores a link with its address, and records it', async () => {
    const { service, evidence, activity } = build();
    await service.add(
      'DPDP-R6-01',
      { kind: 'link', title: 'Config export', url: 'https://example.com/x' },
      actor,
    );
    expect(evidence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'link',
        url: 'https://example.com/x',
        note: null,
        proofRequirementId: null,
        addedById: 'u1',
        addedByName: 'Asha',
      }),
    );
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EVIDENCE_ADDED',
        details: expect.objectContaining({ proof: 'Config export' }),
      }),
    );
  });

  it('stores a note with its text and no address', async () => {
    const { service, evidence } = build();
    await service.add(
      'DPDP-R6-01',
      { kind: 'note', title: 'Review done', note: 'Checked.' },
      actor,
    );
    expect(evidence.create).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'note', url: null, note: 'Checked.' }),
    );
  });

  it('attaches proof to one of the control’s own requirements', async () => {
    const { service, evidence } = build(control(), [requirement()]);
    await service.add(
      'DPDP-R6-01',
      { kind: 'note', title: 'Scan', note: 'Clean.', proofRequirementId: 'PR-P05-01' },
      actor,
    );
    expect(evidence.create).toHaveBeenCalledWith(
      expect.objectContaining({ proofRequirementId: 'PR-P05-01' }),
    );
  });

  it('refuses a requirement that is unknown, archived, or belongs to another control', async () => {
    for (const requirements of [
      [],
      [requirement({ archivedAt: new Date() })],
      [requirement({ controlId: 'DPDP-R7-01' })],
    ]) {
      const { service, evidence } = build(control(), requirements);
      await expect(
        service.add(
          'DPDP-R6-01',
          { kind: 'note', title: 't', note: 'n', proofRequirementId: 'PR-P05-01' },
          actor,
        ),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(evidence.create).not.toHaveBeenCalled();
    }
  });

  it('refuses an archived control', async () => {
    const archived = build(control({ archivedAt: new Date() }));
    await expect(
      archived.service.add('x', { kind: 'note', title: 't', note: 'n' }, actor),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('EvidenceService.remove', () => {
  it('removes proof and records it', async () => {
    const { service, evidence, activity } = build();
    await service.remove('DPDP-R6-01', 'e1', actor);
    expect(evidence.delete).toHaveBeenCalledWith('e1');
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EVIDENCE_REMOVED' }),
    );
  });

  it('refuses proof that is not on this control', async () => {
    const { service, evidence } = build();
    vi.mocked(evidence.findOne).mockResolvedValue(null);
    await expect(service.remove('DPDP-R6-01', 'nope', actor)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
