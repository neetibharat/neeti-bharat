import { describe, expect, it, vi } from 'vitest';
import { DisabledFileStorage } from '../../core/storage/disabled-file-storage';
import type { FileStorage } from '../../core/storage/file-storage';
import { MemoryFileStorage } from '../../core/storage/memory-file-storage';
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

const fileRow = {
  ...row,
  id: 'f1',
  kind: 'file',
  title: 'scan.pdf',
  url: null,
  fileKey: 'evidence/DPDP-R6-01/u/scan.pdf',
  fileName: 'scan.pdf',
  fileSize: 9,
  fileType: 'application/pdf',
  fileSha256: 'abc',
};

function build(
  found: ControlWithLinks | null = control(),
  requirements: unknown[] = [],
  storage: FileStorage = new MemoryFileStorage(),
) {
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
    service: new EvidenceService(controls, evidence, requirementRepo, activity, storage),
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

const pdf = (name = 'scan.pdf') => ({
  originalname: name,
  buffer: Buffer.from('%PDF-1.7 body'),
  size: 13,
});

describe('EvidenceService.addFile', () => {
  it('stores the object, the row and a log entry with no file details', async () => {
    const memory = new MemoryFileStorage();
    const { service, evidence, activity } = build(control(), [], memory);
    vi.mocked(evidence.create).mockResolvedValue(fileRow as never);
    const result = await service.addFile('DPDP-R6-01', { title: 'Pen test' }, pdf(), actor);

    const key = [...memory.objects.keys()][0]!;
    expect(key).toMatch(/^evidence\/DPDP-R6-01\/[0-9a-f-]{36}\/scan\.pdf$/);
    expect(memory.objects.get(key)!.options.contentType).toBe('application/pdf');
    expect(evidence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'file',
        title: 'Pen test',
        file: expect.objectContaining({ key, name: 'scan.pdf', size: 13, type: 'application/pdf' }),
      }),
    );
    const logged = vi.mocked(activity.record).mock.calls[0]![0];
    expect(logged.action).toBe('EVIDENCE_ADDED');
    expect(JSON.stringify(logged)).not.toMatch(/scan\.pdf|evidence\/|[0-9a-f]{64}/);
    expect(result).toMatchObject({ kind: 'file', fileName: 'scan.pdf', fileSize: 9 });
    expect(result).not.toHaveProperty('fileKey');
  });

  it('uses the file name as the title when none is given, without logging it', async () => {
    const { service, evidence, activity } = build();
    await service.addFile('DPDP-R6-01', {}, pdf('Q1 report.pdf'), actor);
    expect(evidence.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Q1 report.pdf' }),
    );
    expect(JSON.stringify(vi.mocked(activity.record).mock.calls)).not.toContain('Q1 report');
  });

  it('removes the object when saving the row fails', async () => {
    const memory = new MemoryFileStorage();
    const { service, evidence } = build(control(), [], memory);
    vi.mocked(evidence.create).mockRejectedValue(new Error('db down'));
    await expect(service.addFile('DPDP-R6-01', {}, pdf(), actor)).rejects.toThrow('db down');
    expect(memory.objects.size).toBe(0);
  });

  it('removes the object when the log entry fails', async () => {
    const memory = new MemoryFileStorage();
    const { service, activity } = build(control(), [], memory);
    vi.mocked(activity.record).mockRejectedValue(new Error('log down'));
    await expect(service.addFile('DPDP-R6-01', {}, pdf(), actor)).rejects.toThrow('log down');
    expect(memory.objects.size).toBe(0);
  });

  it('stores nothing when the upload is refused', async () => {
    const memory = new MemoryFileStorage();
    const { service, evidence } = build(control(), [], memory);
    const exe = { originalname: 'a.pdf', buffer: Buffer.from('MZ'), size: 2 };
    await expect(service.addFile('DPDP-R6-01', {}, exe, actor)).rejects.toMatchObject({
      code: 'FILE_TYPE_NOT_ALLOWED',
    });
    await expect(service.addFile('DPDP-R6-01', {}, undefined, actor)).rejects.toMatchObject({
      code: 'FILE_REQUIRED',
    });
    expect(memory.objects.size).toBe(0);
    expect(evidence.create).not.toHaveBeenCalled();
  });

  it('does not save a row when storing the object failed', async () => {
    const memory = new MemoryFileStorage();
    memory.failOn = 'put';
    const { service, evidence } = build(control(), [], memory);
    await expect(service.addFile('DPDP-R6-01', {}, pdf(), actor)).rejects.toThrow('put failed');
    expect(evidence.create).not.toHaveBeenCalled();
  });

  it('attaches to the control’s own active requirement only', async () => {
    for (const requirements of [[], [requirement({ controlId: 'DPDP-R7-01' })]]) {
      const memory = new MemoryFileStorage();
      const { service } = build(control(), requirements, memory);
      await expect(
        service.addFile('DPDP-R6-01', { proofRequirementId: 'PR-P05-01' }, pdf(), actor),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(memory.objects.size).toBe(0);
    }
    const { service, evidence } = build(control(), [requirement()]);
    await service.addFile('DPDP-R6-01', { proofRequirementId: 'PR-P05-01' }, pdf(), actor);
    expect(evidence.create).toHaveBeenCalledWith(
      expect.objectContaining({ proofRequirementId: 'PR-P05-01' }),
    );
  });

  it('says storage is not set up when there is none', async () => {
    const { service } = build(control(), [], new DisabledFileStorage());
    await expect(service.addFile('DPDP-R6-01', {}, pdf(), actor)).rejects.toMatchObject({
      code: 'STORAGE_NOT_CONFIGURED',
      status: 503,
    });
  });
});

describe('EvidenceService.download', () => {
  it('returns a link that expires in five minutes for a file of the control', async () => {
    const { service, evidence } = build();
    vi.mocked(evidence.findOne).mockResolvedValue(fileRow as never);
    const result = await service.download('DPDP-R6-01', 'f1');
    expect(result.url).toBe('https://files.test/evidence/DPDP-R6-01/u/scan.pdf?expires=300');
    const seconds = (Date.parse(result.expiresAt) - Date.now()) / 1000;
    expect(seconds).toBeGreaterThan(295);
    expect(seconds).toBeLessThanOrEqual(300);
  });

  it('is not found for a link or note, or for proof of another control', async () => {
    const { service, evidence } = build();
    await expect(service.download('DPDP-R6-01', 'e1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    vi.mocked(evidence.findOne).mockResolvedValue(null);
    await expect(service.download('DPDP-R7-01', 'f1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('EvidenceService.remove of a file', () => {
  const setup = async () => {
    const memory = new MemoryFileStorage();
    const built = build(control(), [], memory);
    vi.mocked(built.evidence.findOne).mockResolvedValue(fileRow as never);
    await memory.put(fileRow.fileKey, Buffer.from('x'), { contentType: 'application/pdf' });
    return { ...built, memory };
  };

  it('removes the object after the row and the log entry', async () => {
    const { service, memory, evidence, activity } = await setup();
    await service.remove('DPDP-R6-01', 'f1', actor);
    expect(evidence.delete).toHaveBeenCalledWith('f1');
    expect(activity.record).toHaveBeenCalledOnce();
    expect(memory.objects.size).toBe(0);
  });

  it('still succeeds when storage cannot remove the object', async () => {
    const { service, memory, evidence } = await setup();
    memory.failOn = 'remove';
    await expect(service.remove('DPDP-R6-01', 'f1', actor)).resolves.toBeUndefined();
    expect(evidence.delete).toHaveBeenCalled();
  });

  it('does not touch storage for a link', async () => {
    const memory = new MemoryFileStorage();
    memory.failOn = 'remove';
    const { service } = build(control(), [], memory);
    await expect(service.remove('DPDP-R6-01', 'e1', actor)).resolves.toBeUndefined();
  });
});
