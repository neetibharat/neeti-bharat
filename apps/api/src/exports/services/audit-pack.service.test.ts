import { createHash } from 'node:crypto';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { MemoryFileStorage } from '../../core/storage/memory-file-storage';
import type { ExportRepository } from '../repositories/export.repository';
import { AuditPackService } from './audit-pack.service';
import type { ExportService } from './export.service';

const actor = { id: 'u1', label: 'Meera' };
const sha = (text: string) => createHash('sha256').update(text).digest('hex');

const doc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'We encrypt data.' }] }],
};

const approved = {
  id: 'P08',
  title: 'Security policy',
  approvals: [
    {
      version: 2,
      approvedAt: new Date('2026-11-01T00:00:00Z'),
      approvedByName: 'Priya',
      content: doc,
    },
  ],
};
const draft = { id: 'P09', title: 'Draft one', approvals: [] };

const upload = (id: string, key: string, text: string) => ({
  id,
  control: { id: 'DPDP-R6-01', title: 'Encryption' },
  fileKey: key,
  fileName: 'scan.pdf',
  title: 'scan',
  fileSha256: sha(text),
});

function build(evidence: unknown[], storage = new MemoryFileStorage()) {
  const repository = {
    policies: vi.fn().mockResolvedValue([approved, draft]),
    evidence: vi.fn().mockResolvedValue(evidence),
  } as unknown as ExportRepository;
  const exportService = {
    recordDownload: vi.fn().mockResolvedValue(undefined),
    table: vi.fn().mockResolvedValue({ header: ['a'], rows: [['1']] }),
  };
  const activity = { verify: vi.fn().mockResolvedValue({ ok: true, checked: 7 }) };
  const service = new AuditPackService(
    repository,
    exportService as unknown as ExportService,
    activity as unknown as ActivityService,
    storage,
  );
  return { service, storage, exportService };
}

async function pack(service: AuditPackService) {
  const chunks: Uint8Array[] = [];
  let failure: Error | undefined;
  await service.write(actor, {
    write: (chunk) => void chunks.push(chunk),
    end: (error) => {
      failure = error;
    },
  });
  if (failure) throw failure;
  return unzipSync(Uint8Array.from(chunks.flatMap((chunk) => [...chunk])));
}

describe('AuditPackService', () => {
  it('holds every list, the approved policy text, the proof file, the integrity result and a README', async () => {
    const { service, storage, exportService } = build([upload('e1aaaaaaaa', 'k1', 'PDF')]);
    await storage.put('k1', Buffer.from('PDF'), { contentType: 'application/pdf' });

    const files = await pack(service);

    expect(Object.keys(files).sort()).toEqual(
      [
        'README.txt',
        'activity-log.csv',
        'breaches.csv',
        'checklist.csv',
        'integrity.txt',
        'people.csv',
        'policies.csv',
        'policies/P08 Security policy.md',
        'proof-requirements.csv',
        'proof.csv',
        'proof/DPDP-R6-01/aaaaaaaa-scan.pdf',
        'requests.csv',
      ].sort(),
    );
    expect(strFromU8(files['policies/P08 Security policy.md']!)).toContain('We encrypt data.');
    expect(strFromU8(files['policies/P08 Security policy.md']!)).toContain('Version 2');
    expect(strFromU8(files['proof/DPDP-R6-01/aaaaaaaa-scan.pdf']!)).toBe('PDF');
    expect(strFromU8(files['integrity.txt']!)).toContain('7 events checked');
    expect(strFromU8(files['README.txt']!)).not.toContain('Problems');
    expect(exportService.recordDownload).toHaveBeenCalledWith('audit_pack', actor);
  });

  it('logs the download before it makes anything', async () => {
    const { service, exportService } = build([]);
    const order: string[] = [];
    exportService.recordDownload.mockImplementation(() => {
      order.push('logged');
      return Promise.resolve();
    });
    exportService.table.mockImplementation(() => {
      order.push('table');
      return Promise.resolve({ header: [], rows: [] });
    });
    await pack(service);
    expect(order[0]).toBe('logged');
  });

  it('lists a file it cannot read, or whose fingerprint changed, instead of stopping', async () => {
    const storage = new MemoryFileStorage();
    await storage.put('k2', Buffer.from('changed'), { contentType: 'application/pdf' });
    const { service } = build(
      [upload('e1aaaaaaaa', 'missing', 'x'), upload('e2bbbbbbbb', 'k2', 'original')],
      storage,
    );

    const files = await pack(service);
    const readme = strFromU8(files['README.txt']!);

    expect(readme).toContain('could not be read from storage');
    expect(readme).toContain('does not match the fingerprint');
    expect(files['proof/DPDP-R6-01/bbbbbbbb-scan.pdf']).toBeDefined();
    expect(files['proof/DPDP-R6-01/aaaaaaaa-scan.pdf']).toBeUndefined();
  });
});
