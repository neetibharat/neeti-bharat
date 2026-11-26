import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  CheckAcceptanceListResponse,
  CheckAcceptanceResponse,
  CheckId,
} from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import type { CheckAcceptance } from '../../generated/prisma/client';
import type { AcceptCheckInput } from '../dto/connection.dto';
import { CheckAcceptanceRepository } from '../repositories/check-acceptance.repository';
import { ConnectionRepository } from '../repositories/connection.repository';
import { acceptanceKey, type Accepted } from '../utils/proof-snapshot';

const view = (row: CheckAcceptance): CheckAcceptanceResponse => ({
  id: row.id,
  connectionId: row.connectionId,
  checkId: row.checkId as CheckId,
  resourceName: row.resourceName,
  reason: row.reason,
  acceptedByName: row.acceptedByName,
  acceptedAt: row.acceptedAt.toISOString(),
});

/** What people have decided is deliberate on a connection, so the proofs fed by its checks stop waiting on it. */
@Injectable()
export class CheckAcceptanceService {
  constructor(
    private readonly connections: ConnectionRepository,
    private readonly acceptances: CheckAcceptanceRepository,
    private readonly activity: ActivityService,
  ) {}

  async list(connectionId: string): Promise<CheckAcceptanceListResponse> {
    await this.connection(connectionId);
    return { items: (await this.acceptances.forConnection(connectionId)).map(view) };
  }

  /** The decisions as a set to look things up in, for judging a run. */
  async setOf(connectionId: string): Promise<Accepted> {
    const rows = await this.acceptances.forConnection(connectionId);
    return new Set(rows.map((row) => acceptanceKey(row.checkId, row.resourceName)));
  }

  async accept(
    connectionId: string,
    input: AcceptCheckInput,
    actor: ActivityActor,
  ): Promise<CheckAcceptanceResponse> {
    const connection = await this.connection(connectionId);
    const row = await this.acceptances.upsert({
      connectionId,
      checkId: input.checkId,
      resourceName: input.resourceName,
      reason: input.reason,
      acceptedByName: actor.label,
    });
    await this.activity.record({
      actor,
      action: 'CONNECTION_CHECK_ACCEPTED',
      subject: { type: 'connection', id: connectionId },
      details: { name: connection.name, check: input.checkId },
    });
    return view(row);
  }

  async remove(connectionId: string, id: string, actor: ActivityActor): Promise<void> {
    const connection = await this.connection(connectionId);
    const row = await this.acceptances.findOne(id);
    if (!row || row.connectionId !== connectionId) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    await this.acceptances.delete(id);
    await this.activity.record({
      actor,
      action: 'CONNECTION_CHECK_ACCEPTANCE_REMOVED',
      subject: { type: 'connection', id: connectionId },
      details: { name: connection.name, check: row.checkId },
    });
  }

  private async connection(id: string) {
    const row = await this.connections.findActive(id);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return row;
  }
}
