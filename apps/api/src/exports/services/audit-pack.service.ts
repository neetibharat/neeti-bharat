import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EXPORT_DATASETS, type ExportDataset } from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { FileStorage } from '../../core/storage/file-storage';
import { toPolicyDocument } from '../../frameworks/utils/policy-document';
import { ExportRepository } from '../repositories/export.repository';
import { toCsv } from '../utils/csv';
import { documentToMarkdown } from '../utils/doc-markdown';
import { PackWriter, type PackSink } from '../utils/pack-writer';
import type { PackPaths } from '../utils/tables';
import { dayStamp, safeName } from '../utils/zip-names';
import { ExportService } from './export.service';

type Writer = PackWriter;

const CSV_NAMES: Record<ExportDataset, string> = {
  checklist: 'checklist.csv',
  proof_requirements: 'proof-requirements.csv',
  evidence: 'proof.csv',
  policies: 'policies.csv',
  breaches: 'breaches.csv',
  requests: 'requests.csv',
  people: 'people.csv',
  activity: 'activity-log.csv',
};

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

/** Everything an auditor asks for, in one zip: the lists as CSV, the approved policy texts and the proof files. */
@Injectable()
export class AuditPackService {
  constructor(
    private readonly repository: ExportRepository,
    private readonly exports: ExportService,
    private readonly activity: ActivityService,
    private readonly storage: FileStorage,
  ) {}

  /** The download is logged first, so a pack that is taken is always on record. */
  async write(actor: ActivityActor, sink: PackSink): Promise<void> {
    await this.exports.recordDownload('audit_pack', actor);
    const writer = new PackWriter(sink);
    const problems: string[] = [];
    try {
      const policies = await this.addPolicies(writer);
      const files = await this.addFiles(writer, problems);
      await this.addLists(writer, { files, policies });
      writer.text('integrity.txt', await this.integrity());
      writer.text('README.txt', readme(actor, new Date(), problems));
      writer.finish();
    } catch (error) {
      sink.end(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async addLists(writer: Writer, index: { files: PackPaths; policies: PackPaths }) {
    for (const dataset of EXPORT_DATASETS) {
      const table = await this.exports.table(dataset, index);
      writer.text(CSV_NAMES[dataset], toCsv(table.header, table.rows));
    }
  }

  /** Each policy's newest approved text. A policy that was never approved has none to give. */
  private async addPolicies(writer: Writer): Promise<PackPaths> {
    const paths = new Map<string, string>();
    for (const policy of await this.repository.policies()) {
      const approval = policy.approvals[0];
      if (!approval) continue;
      const path = `policies/${safeName(`${policy.id} ${policy.title}`)}.md`;
      const heading = `# ${policy.title}\n\nVersion ${approval.version}, approved on ${approval.approvedAt.toISOString().slice(0, 10)} by ${approval.approvedByName}.\n\n`;
      writer.text(path, heading + documentToMarkdown(toPolicyDocument(approval.content)));
      paths.set(policy.id, path);
    }
    return paths;
  }

  /** Uploaded proof, one file at a time. A file that cannot be read is listed in the README instead of stopping the pack. */
  private async addFiles(writer: Writer, problems: string[]): Promise<PackPaths> {
    const paths = new Map<string, string>();
    const uploads = (await this.repository.evidence()).filter((item) => item.fileKey);
    for (const item of uploads) {
      const label = `${item.control.id}: ${item.fileName ?? item.title}`;
      try {
        const bytes = await this.storage.read(item.fileKey!);
        if (item.fileSha256 && sha256(bytes) !== item.fileSha256) {
          problems.push(`${label} does not match the fingerprint saved when it was uploaded.`);
        }
        const path = `proof/${item.control.id}/${item.id.slice(-8)}-${safeName(item.fileName ?? item.title)}`;
        writer.file(path, bytes);
        paths.set(item.id, path);
      } catch {
        problems.push(`${label} could not be read from storage, so it is not in the pack.`);
      }
    }
    return paths;
  }

  private async integrity(): Promise<string> {
    const result = await this.activity.verify();
    if (result.ok) {
      return `The activity log is intact: ${result.checked} events checked, none changed or missing.\n`;
    }
    return `The activity log FAILED its integrity check after ${result.checked} events.\n`;
  }
}

function readme(actor: ActivityActor, now: Date, problems: string[]): string {
  const lines = [
    `Audit pack, ${dayStamp(now)}`,
    `Made by ${actor.label}.`,
    '',
    'Lists (CSV, open in Excel):',
    ...EXPORT_DATASETS.map((dataset) => `  ${CSV_NAMES[dataset]}`),
    '',
    'policies/   the newest approved text of each policy',
    'proof/      the files uploaded as proof, one folder per control',
    'integrity.txt   the result of checking the activity log for changes',
    '',
    'proof.csv lists every piece of proof, including links and notes that have no file.',
  ];
  if (problems.length)
    lines.push('', 'Problems found while making this pack:', ...problems.map((p) => `  - ${p}`));
  return `${lines.join('\n')}\n`;
}
