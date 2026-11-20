import { HttpStatus, Injectable } from '@nestjs/common';
import {
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

  /** Nothing is held open while the system is read: the run and what goes with it are saved together, only now. */
  async save(
    row: Connection,
    actor: ActivityActor,
    bySchedule: boolean,
    results: ConnectionCheckResult[],
  ): Promise<ConnectionRunResponse> {
    const counts = tally(results);
    const accepted = await this.acceptances.setOf(row.id);
    const saved = await this.runs.createWith(
      { connectionId: row.id, ranByName: actor.label, bySchedule, results, ...counts },
      async (run) => {
        if (row.scheduleFailedAt) await this.connections.setScheduleFailure(row.id, null);
        const connection = { name: row.name, provider: row.provider as ConnectionProvider };
        await this.snapshots.record(connection, results, accepted, run.ranAt);
        await this.activity.record({
          actor,
          action: 'CONNECTION_CHECKED',
          subject: { type: 'connection', id: row.id },
          details: { name: row.name, passed: counts.passed, total: results.length },
        });
      },
    );
    return toRunResponse(saved);
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
