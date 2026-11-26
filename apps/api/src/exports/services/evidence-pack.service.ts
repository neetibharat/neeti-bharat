import { Injectable } from '@nestjs/common';
import type { RulePageResponse } from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import type { ActivityEvent } from '../../generated/prisma/client';
import { FileStorage } from '../../core/storage/file-storage';
import { FrameworksService } from '../../frameworks/services/frameworks.service';
import { ExportRepository, type ActivitySubject } from '../repositories/export.repository';
import { toCsv } from '../utils/csv';
import { controlsTable, evidenceReadme } from '../utils/evidence-tables';
import { addPolicyTexts, addProofFiles, integrityText } from '../utils/pack-content';
import { PackWriter, type PackSink } from '../utils/pack-writer';
import {
  activityTable,
  evidenceTable,
  policyTable,
  proofRequirementTable,
  type Table,
} from '../utils/tables';
import { ExportService } from './export.service';

/** The rule, its framework's name and the page it was read from, kept together while the pack is made. */
export interface EvidenceTarget {
  page: RulePageResponse;
  frameworkName: string;
}

/** One rule's evidence in a zip: its controls, the approved policies behind them, the proof, and what was done about it. */
@Injectable()
export class EvidencePackService {
  constructor(
    private readonly repository: ExportRepository,
    private readonly exports: ExportService,
    private readonly frameworks: FrameworksService,
    private readonly activity: ActivityService,
    private readonly storage: FileStorage,
  ) {}

  /** Reads the rule before anything is sent, so a rule that does not exist is a plain 404 and not a broken download. */
  async load(frameworkId: string, ruleId: string): Promise<EvidenceTarget> {
    const page = await this.frameworks.rulePage(frameworkId, ruleId);
    const { frameworks } = await this.frameworks.list();
    const framework = frameworks.find((item) => item.id === page.rule.frameworkId);
    return { page, frameworkName: framework?.name ?? page.rule.frameworkId };
  }

  /** The download is logged first, so a pack that is taken is always on record. */
  async write(target: EvidenceTarget, actor: ActivityActor, sink: PackSink): Promise<void> {
    const { rule } = target.page;
    await this.exports.recordEvidencePack(`${rule.reference}, ${rule.title}`, actor);
    const writer = new PackWriter(sink);
    const problems: string[] = [];
    try {
      await this.fill(writer, target, actor, problems);
      writer.finish();
    } catch (error) {
      sink.end(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async fill(
    writer: PackWriter,
    target: EvidenceTarget,
    actor: ActivityActor,
    problems: string[],
  ): Promise<void> {
    const { rule, policies } = target.page;
    const controlIds = rule.controls.map((control) => control.id);
    const policyIds = policies.map((policy) => policy.id);
    const [policyRows, evidence, requirements] = await Promise.all([
      this.repository.policies(policyIds),
      this.repository.evidence(controlIds),
      this.repository.proofRequirements(controlIds),
    ]);
    const policyPaths = addPolicyTexts(writer, policyRows);
    const filePaths = await addProofFiles(writer, evidence, this.storage, problems);
    const events = await this.events([
      { type: 'requirement', id: rule.id },
      ...controlIds.map((id) => ({ type: 'control', id })),
      ...policyIds.map((id) => ({ type: 'policy', id })),
    ]);
    const tables: [string, Table][] = [
      ['controls.csv', controlsTable(rule)],
      ['proof-requirements.csv', proofRequirementTable(requirements)],
      ['proof.csv', evidenceTable(evidence, filePaths)],
      ['policies.csv', policyTable(policyRows, policyPaths)],
      ['activity-log.csv', activityTable(events)],
    ];
    for (const [name, table] of tables) writer.text(name, toCsv(table.header, table.rows));
    writer.text('integrity.txt', integrityText(await this.activity.verify()));
    const { frameworkName } = target;
    const readme = evidenceReadme({
      frameworkName,
      rule,
      madeBy: actor.label,
      now: new Date(),
      problems,
    });
    writer.text('README.txt', readme);
  }

  private async events(subjects: ActivitySubject[]): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];
    for (let after: bigint | null = null; ;) {
      const batch = await this.repository.activityAfter(after, subjects);
      if (batch.length === 0) return events;
      events.push(...batch);
      after = batch[batch.length - 1]!.seq;
    }
  }
}
