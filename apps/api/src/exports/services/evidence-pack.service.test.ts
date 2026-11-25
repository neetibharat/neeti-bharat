import { createHash } from 'node:crypto';
import type { RulePageResponse } from '@dpdp-kit/shared';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { MemoryFileStorage } from '../../core/storage/memory-file-storage';
import type { FrameworksService } from '../../frameworks/services/frameworks.service';
import type { ExportRepository } from '../repositories/export.repository';
import { EvidencePackService } from './evidence-pack.service';
import type { ExportService } from './export.service';

const actor = { id: 'u1', label: 'Meera' };
const sha = (text: string) => createHash('sha256').update(text).digest('hex');

const control = {
  id: 'DPDP-R6-01',
  title: 'Encryption',
  description: 'Encrypt personal data at rest.',
  policies: [{ id: 'P08', title: 'Security policy' }],
  status: 'in_progress',
  policiesApproved: 1,
  policiesTotal: 1,
  ownerRole: 'SECURITY_LEAD',
  ownerName: 'Priya',
  assignee: null,
  reviewDate: null,
  evidenceCount: 1,
  proofRequired: 2,
  proofProvided: 1,
};

const page = {
  rule: {
    id: 'R6',
    frameworkId: 'dpdp',
    reference: 'Rule 6',
    title: 'Security safeguards',
    summary: 'Protect personal data with reasonable safeguards.',
    applies: true,
    controls: [control],
  },
  policies: [{ id: 'P08' }],
} as unknown as RulePageResponse;

const policyRow = {
  id: 'P08',
  title: 'Security policy',
  status: 'approved',
  ownerRole: 'SECURITY_LEAD',
  approver: { name: 'Priya' },
  approverTitle: 'CISO',
  reviewEvery: '1y',
  approvedAt: new Date('2026-11-01T00:00:00Z'),
  approvedByName: 'Priya',
  legalReferences: ['s.8(5)'],
  approvals: [
    {
      version: 2,
      approvedAt: new Date('2026-11-01T00:00:00Z'),
      approvedByName: 'Priya',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'We encrypt data.' }] }],
      },
    },
  ],
};

const upload = (text: string, sha256 = sha(text)) => ({
  id: 'e1aaaaaaaa',
  control: { id: 'DPDP-R6-01', title: 'Encryption' },
  fileKey: 'k1',
  fileName: 'scan.pdf',
  title: 'scan',
  fileSha256: sha256,
  kind: 'file',
  proofRequirement: null,
  url: null,
  note: null,
  fileSize: 3,
  fileType: 'application/pdf',
  addedByName: 'Priya',
  createdAt: new Date('2026-11-02T00:00:00Z'),
});

function build(evidence: unknown[] = []) {
  const repository = {
    policies: vi.fn().mockResolvedValue([policyRow]),
    evidence: vi.fn().mockResolvedValue(evidence),
    proofRequirements: vi.fn().mockResolvedValue([]),
    activityAfter: vi.fn().mockResolvedValueOnce([]),
  };
  const exportService = { recordEvidencePack: vi.fn().mockResolvedValue(undefined) };
  const frameworks = {
    rulePage: vi.fn().mockResolvedValue(page),
    list: vi.fn().mockResolvedValue({ frameworks: [{ id: 'dpdp', name: 'DPDP Act 2023' }] }),
  };
  const activity = { verify: vi.fn().mockResolvedValue({ ok: true, checked: 9 }) };
  const storage = new MemoryFileStorage();
  const service = new EvidencePackService(
    repository as unknown as ExportRepository,
    exportService as unknown as ExportService,
    frameworks as unknown as FrameworksService,
    activity as unknown as ActivityService,
    storage,
  );
  return { service, repository, exportService, frameworks, storage };
}

async function pack(service: EvidencePackService) {
  const target = await service.load('dpdp', 'R6');
  const chunks: Uint8Array[] = [];
  let failure: Error | undefined;
  await service.write(target, actor, {
    write: (chunk) => void chunks.push(chunk),
    end: (error) => {
      failure = error;
    },
  });
  if (failure) throw failure;
  return unzipSync(Uint8Array.from(chunks.flatMap((chunk) => [...chunk])));
}

describe('EvidencePackService', () => {
  it('holds the rule, its controls, the approved policy text, the proof file and the integrity result', async () => {
    const { service, storage } = build([upload('PDF')]);
    await storage.put('k1', Buffer.from('PDF'), { contentType: 'application/pdf' });

    const files = await pack(service);

    expect(Object.keys(files).sort()).toEqual(
      [
        'README.txt',
        'activity-log.csv',
        'controls.csv',
        'integrity.txt',
        'policies.csv',
        'policies/P08 Security policy.md',
        'proof-requirements.csv',
        'proof.csv',
        'proof/DPDP-R6-01/aaaaaaaa-scan.pdf',
      ].sort(),
    );
    const readme = strFromU8(files['README.txt']!);
    expect(readme).toContain('Evidence pack: Rule 6, Security safeguards');
    expect(readme).toContain('DPDP Act 2023');
    expect(readme).toContain(
      'DPDP-R6-01 Encryption: In progress. Policies approved 1 of 1. Proof 1 of 2.',
    );
    expect(readme).not.toContain('Problems');
    expect(strFromU8(files['controls.csv']!)).toContain('Encrypt personal data at rest.');
    expect(strFromU8(files['policies/P08 Security policy.md']!)).toContain('We encrypt data.');
    expect(strFromU8(files['integrity.txt']!)).toContain('9 events checked');
  });

  it('reads only the proof, policies and events that belong to this rule', async () => {
    const { service, repository } = build();
    await pack(service);

    expect(repository.evidence).toHaveBeenCalledWith(['DPDP-R6-01']);
    expect(repository.proofRequirements).toHaveBeenCalledWith(['DPDP-R6-01']);
    expect(repository.policies).toHaveBeenCalledWith(['P08']);
    expect(repository.activityAfter).toHaveBeenCalledWith(null, [
      { type: 'requirement', id: 'R6' },
      { type: 'control', id: 'DPDP-R6-01' },
      { type: 'policy', id: 'P08' },
    ]);
  });

  it('logs the download, by the rule it is for, before it makes anything', async () => {
    const { service, exportService, repository } = build();
    const order: string[] = [];
    exportService.recordEvidencePack.mockImplementation(() => {
      order.push('logged');
      return Promise.resolve();
    });
    repository.policies.mockImplementation(() => {
      order.push('read');
      return Promise.resolve([]);
    });
    await pack(service);
    expect(order[0]).toBe('logged');
    expect(exportService.recordEvidencePack).toHaveBeenCalledWith(
      'Rule 6, Security safeguards',
      actor,
    );
  });

  it('lists a file it cannot read, or whose fingerprint changed, instead of stopping', async () => {
    const { service, storage } = build([upload('PDF', sha('something else'))]);
    await storage.put('k1', Buffer.from('PDF'), { contentType: 'application/pdf' });
    const changed = strFromU8((await pack(service))['README.txt']!);
    expect(changed).toContain('does not match the fingerprint');

    const { service: missing } = build([upload('PDF')]);
    const lost = await pack(missing);
    expect(strFromU8(lost['README.txt']!)).toContain('could not be read from storage');
    expect(Object.keys(lost).some((name) => name.startsWith('proof/'))).toBe(false);
  });

  it('does not make a pack for a rule that does not exist', async () => {
    const { service, frameworks } = build();
    frameworks.rulePage.mockRejectedValue(new Error('NOT_FOUND'));
    await expect(service.load('dpdp', 'nope')).rejects.toThrow('NOT_FOUND');
  });
});
