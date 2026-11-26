import { Injectable } from '@nestjs/common';
import { EXPORT_DATASETS, type ExportDataset } from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { FileStorage } from '../../core/storage/file-storage';
import { ExportRepository } from '../repositories/export.repository';
import { toCsv } from '../utils/csv';
import { addPolicyTexts, addProofFiles, integrityText } from '../utils/pack-content';
import { PackWriter, type PackSink } from '../utils/pack-writer';
import type { PackPaths } from '../utils/tables';
import { dayStamp } from '../utils/zip-names';
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
      const policies = addPolicyTexts(writer, await this.repository.policies());
      const evidence = await this.repository.evidence();
      const files = await addProofFiles(writer, evidence, this.storage, problems);
      await this.addLists(writer, { files, policies });
      writer.text('integrity.txt', integrityText(await this.activity.verify()));
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
