import { Injectable } from '@nestjs/common';
import type { ConnectionCheckResult } from '@dpdp-kit/shared';
import type { ConnectionRun, Prisma } from '../../generated/prisma/client';
import { orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';

export type ConnectionRunSummaryRow = Omit<ConnectionRun, 'results' | 'organizationId'>;

export interface NewConnectionRun {
  connectionId: string;
  ranByName: string;
  results: ConnectionCheckResult[];
  passed: number;
  warned: number;
  failed: number;
  skipped: number;
}

const summary = {
  id: true,
  connectionId: true,
  ranAt: true,
  ranByName: true,
  passed: true,
  warned: true,
  failed: true,
  skipped: true,
} satisfies Prisma.ConnectionRunSelect;

@Injectable()
export class ConnectionRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewConnectionRun): Promise<ConnectionRun> {
    return this.prisma.db.connectionRun.create({
      data: { ...data, ...orgOwned(), results: data.results as unknown as Prisma.InputJsonValue },
    });
  }

  /**
   * Saves the run and whatever has to be saved with it, such as its activity log entry, together or not at all. It
   * opens the transaction itself, because a run reads a system for seconds first, and a transaction held open that
   * long would expire.
   */
  createWith(
    data: NewConnectionRun,
    alongside: (run: ConnectionRun) => Promise<void>,
  ): Promise<ConnectionRun> {
    return this.prisma.runInTransaction(async () => {
      const run = await this.create(data);
      await alongside(run);
      return run;
    });
  }

  findById(id: string): Promise<ConnectionRun | null> {
    return this.prisma.db.connectionRun.findUnique({ where: { id } });
  }

  /** When the connection was last checked, if ever. */
  async lastRanAt(connectionId: string): Promise<Date | null> {
    const row = await this.prisma.db.connectionRun.findFirst({
      where: { connectionId },
      orderBy: { ranAt: 'desc' },
      select: { ranAt: true },
    });
    return row?.ranAt ?? null;
  }

  /** One page of runs, newest first, without their results. */
  async list(connectionId: string, page: number, limit: number) {
    const where = { connectionId };
    const [rows, total] = await Promise.all([
      this.prisma.db.connectionRun.findMany({
        where,
        select: summary,
        orderBy: [{ ranAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.db.connectionRun.count({ where }),
    ]);
    return { rows, total };
  }
}
