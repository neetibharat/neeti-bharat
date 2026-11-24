import { HttpStatus, Injectable } from '@nestjs/common';
import {
  checksOn,
  type CheckId,
  type ConnectionCheckResult,
  type ConnectionProvider,
  type ConnectionRunListResponse,
  type ConnectionRunResponse,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { ProofSnapshotService } from '../../frameworks/services/proof-snapshot.service';
import type { Connection } from '../../generated/prisma/client';
import { tally } from '../providers/outcome';
import { ConnectionRunRepository } from '../repositories/connection-run.repository';
import { ConnectionRepository } from '../repositories/connection.repository';
import { carryOver } from '../utils/carry-over';
import { toRunResponse, toRunSummary } from '../utils/connection-mapper';
import { CheckAcceptanceService } from './check-acceptance.service';

/** Keeps what a run found, and what goes with it: the log entry, the notes on the proofs it backs up, and the schedule's mark. */
@Injectable()
export class ConnectionRunService {
  constructor(
    private readonly runs: ConnectionRunRepository,
    private readonly connections: ConnectionRepository,
    private readonly activity: ActivityService,
    private readonly acceptances: CheckAcceptanceService,
    private readonly snapshots: ProofSnapshotService,
  ) {}

  /**
   * Nothing is held open while the system is read: the run and what goes with it are saved together, only now. A run of
   * only some checks keeps the others as the run before found them, so the latest run always has every check.
   */
  async save(
    row: Connection,
    actor: ActivityActor,
    how: { bySchedule: boolean; only?: ReadonlySet<CheckId> },
    fresh: ConnectionCheckResult[],
  ): Promise<ConnectionRunResponse> {
    const rechecked = how.only ? [...how.only] : [];
    const results = how.only ? carryOver(fresh, await this.previous(row)) : fresh;
    const counts = tally(results);
    const accepted = await this.acceptances.setOf(row.id);
    const saved = await this.runs.createWith(
      {
        connectionId: row.id,
        ranByName: actor.label,
        bySchedule: how.bySchedule,
        rechecked,
        results,
        ...counts,
      },
      async (run) => {
        if (row.scheduleFailedAt) await this.connections.setScheduleFailure(row.id, null);
        const connection = { name: row.name, provider: row.provider as ConnectionProvider };
        await this.snapshots.record(connection, results, accepted, run.ranAt);
        await this.activity.record({
          actor,
          subject: { type: 'connection', id: row.id },
          ...(how.only
            ? {
                action: 'CONNECTION_RECHECKED',
                details: { name: row.name, count: fresh.length, passed: tally(fresh).passed },
              }
            : {
                action: 'CONNECTION_CHECKED',
                details: { name: row.name, passed: counts.passed, total: results.length },
              }),
        });
      },
    );
    return toRunResponse(saved);
  }

  /** The last run's results, without the checks of groups that have been turned off since. */
  private async previous(row: Connection) {
    const run = await this.runs.latest(row.id);
    if (!run) return null;
    const on = new Set(checksOn(row.provider as ConnectionProvider, row.groupsOff));
    const results = (run.results as unknown as ConnectionCheckResult[]).filter((result) =>
      on.has(result.id),
    );
    return { results, ranAt: run.ranAt };
  }

  async list(
    connectionId: string,
    page: number,
    limit: number,
  ): Promise<ConnectionRunListResponse> {
    const { rows, total } = await this.runs.list(connectionId, page, limit);
    return { items: rows.map(toRunSummary), total, page, pageSize: limit };
  }

  async find(runId: string): Promise<ConnectionRunResponse> {
    const row = await this.runs.findById(runId);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return toRunResponse(row);
  }

  lastRanAt(connectionId: string): Promise<Date | null> {
    return this.runs.lastRanAt(connectionId);
  }
}
