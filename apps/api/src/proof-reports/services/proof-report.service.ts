import { Injectable, Logger } from '@nestjs/common';
import { runInOrganization } from '../../core/org/org-context';
import { SystemProofService } from '../../frameworks/services/system-proof.service';
import { ReportSourceRepository } from '../repositories/report-source.repository';
import { TrainingService } from '../../training/services/training.service';
import {
  cloudReport,
  policyReport,
  trainingReport,
  websiteReport,
  type Built,
} from '../utils/report-builders';
import { dateOf, reportText } from '../utils/report-doc';
import { renderPdf } from '../utils/report-pdf';

const HOUR_MS = 60 * 60 * 1000;

interface ReportKind {
  /** The catalogue id of the proof it is kept on. */
  proofId: string;
  /** The title it is kept under, which is also how its last copy is found. */
  title: string;
  fileStem: string;
  /** The least time between two copies, so a report that changes all day is not kept all day. */
  gapHours: number;
  build: (service: ProofReportService, now: Date) => Promise<Built | null>;
}

const REPORTS: readonly ReportKind[] = [
  {
    proofId: 'PR-P19-04',
    title: 'Report: Cloud configuration check',
    fileStem: 'cloud-configuration-check',
    gapHours: 24,
    build: async (s, now) => cloudReport(await s.source.latestCloudRuns(), now),
  },
  {
    proofId: 'PR-P19-03',
    title: 'Report: Website check',
    fileStem: 'website-check',
    gapHours: 24,
    build: async (s, now) => websiteReport(await s.source.latestWebsiteCheck(), now),
  },
  {
    proofId: 'PR-P03-03',
    title: 'Report: Security awareness training',
    fileStem: 'security-awareness-training',
    gapHours: 7 * 24,
    build: async (s, now) => trainingReport(await s.training.report(now), now),
  },
  {
    proofId: 'PR-P19-01',
    title: 'Report: Policy approval records',
    fileStem: 'policy-approval-records',
    gapHours: 24,
    build: async (s, now) => policyReport(await s.source.policiesWithApproval(), now),
  },
];

/** The reports' proof ids, for a test to check against the catalogue. */
export const REPORT_PROOF_IDS: readonly string[] = REPORTS.map((report) => report.proofId);

/**
 * Keeps a report on the proofs that are really a report of what the kit holds: the cloud and website checks, the training,
 * and the policy approvals. A report is made when what it reports on has changed since the last copy, and not twice in a
 * day (a week for training). It is a PDF when files can be kept, and a note when they cannot.
 */
@Injectable()
export class ProofReportService {
  private readonly logger = new Logger(ProofReportService.name);

  constructor(
    readonly source: ReportSourceRepository,
    readonly training: TrainingService,
    private readonly system: SystemProofService,
  ) {}

  /** Every open organisation. One that fails is logged and does not stop the others. */
  async refreshAll(now: Date): Promise<void> {
    for (const organization of await this.source.openOrganizations()) {
      try {
        await runInOrganization(organization.id, () => this.refresh(now));
      } catch (error) {
        this.logger.error(`Reports for ${organization.id} failed`, error as Error);
      }
    }
  }

  async refresh(now: Date): Promise<void> {
    for (const report of REPORTS) {
      try {
        await this.keep(report, now);
      } catch (error) {
        this.logger.error(`The report ${report.title} failed`, error as Error);
      }
    }
  }

  private async keep(report: ReportKind, now: Date): Promise<void> {
    const last = await this.system.latestAt(report.proofId, report.title);
    if (last && now.getTime() - last.getTime() < report.gapHours * HOUR_MS) return;
    const built = await report.build(this, now);
    if (!built || (last && built.sourceAt <= last)) return;
    if (this.system.canKeepFiles()) {
      const pdf = await renderPdf(built.doc, now);
      await this.system.attachPdf(
        report.proofId,
        report.title,
        `${report.fileStem}-${dateOf(now)}.pdf`,
        pdf,
      );
    } else {
      await this.system.attachNote(report.proofId, report.title, reportText(built.doc));
    }
  }
}
