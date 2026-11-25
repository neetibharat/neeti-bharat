import { Injectable } from '@nestjs/common';
import type { ConnectionCheckResult, ConnectionProvider } from '@dpdp-kit/shared';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { CloudRunInput, PolicyInput, WebsiteInput } from '../utils/report-builders';

/** Reads what the reports are made from. It only reads, and sees only the organisation the code is working in. */
@Injectable()
export class ReportSourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The organisations that are still open. Organisations are not scoped, so this works outside a request. */
  openOrganizations(): Promise<{ id: string }[]> {
    return this.prisma.db.organization.findMany({
      where: { closedAt: null },
      select: { id: true },
    });
  }

  /** The latest run of each connection that has not been removed and has been checked, with what was accepted. */
  async latestCloudRuns(): Promise<CloudRunInput[]> {
    const rows = await this.prisma.db.connection.findMany({
      where: { removedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        runs: { orderBy: { ranAt: 'desc' }, take: 1 },
        acceptances: { select: { checkId: true, resourceName: true, reason: true } },
      },
    });
    return rows.flatMap((row) => {
      const run = row.runs[0];
      if (!run) return [];
      return [
        {
          connectionName: row.name,
          provider: row.provider as ConnectionProvider,
          ranAt: run.ranAt,
          ranByName: run.ranByName,
          bySchedule: run.bySchedule,
          results: run.results as unknown as ConnectionCheckResult[],
          accepted: row.acceptances,
        },
      ];
    });
  }

  async latestWebsiteCheck(): Promise<WebsiteInput | null> {
    const row = await this.prisma.db.websiteCheck.findFirst({ orderBy: { checkedAt: 'desc' } });
    if (!row) return null;
    return { ...row, results: row.results as unknown as WebsiteInput['results'] };
  }

  /** Every policy that has not been archived, with its newest approval. */
  async policiesWithApproval(): Promise<PolicyInput[]> {
    const rows = await this.prisma.db.policy.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        title: true,
        approvals: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true, approvedAt: true, approvedByName: true },
        },
      },
    });
    return rows.map((row) => ({
      title: row.title,
      version: row.approvals[0]?.version ?? null,
      approvedAt: row.approvals[0]?.approvedAt ?? null,
      approvedByName: row.approvals[0]?.approvedByName ?? null,
    }));
  }
}
