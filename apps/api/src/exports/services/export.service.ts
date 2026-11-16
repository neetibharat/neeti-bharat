import { Injectable } from '@nestjs/common';
import { EXPORT_LOG_NAMES, type ExportDataset } from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import type { ActivityEvent } from '../../generated/prisma/client';
import { FrameworksService } from '../../frameworks/services/frameworks.service';
import { ExportRepository } from '../repositories/export.repository';
import { toCsv } from '../utils/csv';
import {
  activityTable,
  breachTable,
  checklistTable,
  evidenceTable,
  peopleTable,
  policyTable,
  proofRequirementTable,
  requestTable,
  type PackPaths,
  type Table,
} from '../utils/tables';
import { dayStamp } from '../utils/zip-names';

/** Where the uploaded files and policy texts sit in the audit pack, so the lists can point to them. */
export interface PackIndex {
  files?: PackPaths;
  policies?: PackPaths;
}

@Injectable()
export class ExportService {
  constructor(
    private readonly repository: ExportRepository,
    private readonly frameworks: FrameworksService,
    private readonly activity: ActivityService,
  ) {}

  /** One table as a CSV, and the name to save it under. The download is written to the activity log. */
  async csv(
    dataset: ExportDataset,
    actor: ActivityActor,
  ): Promise<{ fileName: string; body: string }> {
    const table = await this.table(dataset);
    await this.recordDownload(dataset, actor);
    const name = dataset.replaceAll('_', '-');
    return {
      fileName: `${name}-${dayStamp(new Date())}.csv`,
      body: toCsv(table.header, table.rows),
    };
  }

  async table(dataset: ExportDataset, index: PackIndex = {}): Promise<Table> {
    const builders: Record<ExportDataset, () => Promise<Table>> = {
      checklist: () => this.checklist(),
      proof_requirements: async () =>
        proofRequirementTable(await this.repository.proofRequirements()),
      evidence: async () => evidenceTable(await this.repository.evidence(), index.files),
      policies: async () => policyTable(await this.repository.policies(), index.policies),
      breaches: async () => breachTable(await this.repository.breaches()),
      requests: async () => requestTable(await this.repository.requests()),
      people: () => this.people(),
      activity: () => this.activityLog(),
    };
    return builders[dataset]();
  }

  recordDownload(what: ExportDataset | 'audit_pack', actor: ActivityActor): Promise<void> {
    return this.activity.record({
      actor,
      action: 'DATA_EXPORTED',
      details: { what: EXPORT_LOG_NAMES[what] },
    });
  }

  private async checklist(): Promise<Table> {
    const { frameworks } = await this.frameworks.list();
    const lists = await Promise.all(
      frameworks.map((framework) => this.frameworks.checklist(framework.id)),
    );
    return checklistTable(lists);
  }

  private async people(): Promise<Table> {
    const people = await this.repository.people();
    const accounts = await this.repository.accounts(people.map((person) => person.email));
    return peopleTable(people, accounts);
  }

  private async activityLog(): Promise<Table> {
    const events: ActivityEvent[] = [];
    for (let after: bigint | null = null; ;) {
      const batch = await this.repository.activityAfter(after);
      if (batch.length === 0) break;
      events.push(...batch);
      after = batch[batch.length - 1]!.seq;
    }
    return activityTable(events);
  }
}
