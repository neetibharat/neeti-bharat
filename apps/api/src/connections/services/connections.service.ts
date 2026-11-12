import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CONNECTION_RUN_GAP_SECONDS,
  type ConnectionListResponse,
  type ConnectionRunListResponse,
  type ConnectionRunResponse,
  type ConnectionSummary,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { currentOrganizationId } from '../../core/org/org-context';
import { SecretBox } from '../../core/secrets/secret-box';
import type { Connection } from '../../generated/prisma/client';
import type { CreateConnectionInput } from '../dto/connection.dto';
import { AzureConnector, type AzureCredentials } from '../providers/azure/azure-api';
import { runAzureChecks, tally } from '../providers/azure/run-azure-checks';
import { ConnectionRunRepository } from '../repositories/connection-run.repository';
import { ConnectionRepository } from '../repositories/connection.repository';
import {
  failureOf,
  identifiersOf,
  toRunResponse,
  toRunSummary,
  toSummary,
} from '../utils/connection-mapper';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly connections: ConnectionRepository,
    private readonly runs: ConnectionRunRepository,
    private readonly secrets: SecretBox,
    private readonly azure: AzureConnector,
    private readonly activity: ActivityService,
  ) {}

  async list(page: number, limit: number): Promise<ConnectionListResponse> {
    const { rows, total } = await this.connections.list(page, limit);
    const latest = await this.connections.latestRuns(rows.map((row) => row.id));
    const byConnection = new Map(latest.map((run) => [run.connectionId, run]));
    return {
      enabled: this.secrets.isEnabled(),
      items: rows.map((row) => toSummary(row, byConnection.get(row.id))),
      total,
      page,
      pageSize: limit,
    };
  }

  /** Signs in with the details to see that they work, then keeps them sealed. Nothing is kept if they do not work. */
  async create(input: CreateConnectionInput, actor: ActivityActor): Promise<ConnectionSummary> {
    if (!this.secrets.isEnabled()) {
      throw new AppException('SECRETS_NOT_CONFIGURED', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.confirmWorks(input.credentials);
    const row = await this.connections.create({
      provider: input.provider,
      name: input.name,
      identifiers: identifiersOf(input.credentials),
      credentials: this.secrets.seal(JSON.stringify(input.credentials), this.context()),
      createdByName: actor.label,
    });
    await this.activity.record({
      actor,
      action: 'CONNECTION_ADDED',
      subject: { type: 'connection', id: row.id },
      details: { name: row.name, provider: row.provider },
    });
    return toSummary(row, undefined);
  }

  async remove(id: string, actor: ActivityActor): Promise<void> {
    const row = await this.find(id);
    await this.connections.remove(id, new Date());
    await this.activity.record({
      actor,
      action: 'CONNECTION_REMOVED',
      subject: { type: 'connection', id },
      details: { name: row.name },
    });
  }

  /** Reads the system now and keeps what it finds. It takes a few seconds, and is not repeated within seconds. */
  async run(id: string, actor: ActivityActor): Promise<ConnectionRunResponse> {
    const row = await this.find(id);
    await this.refuseIfJustRun(id);
    const credentials = this.credentialsOf(row);
    await this.confirmWorks(credentials);
    const results = await runAzureChecks(
      this.azure.connect(credentials),
      credentials.subscriptionId,
    );
    const counts = tally(results);
    const saved = await this.runs.create({
      connectionId: id,
      ranByName: actor.label,
      results,
      ...counts,
    });
    await this.activity.record({
      actor,
      action: 'CONNECTION_CHECKED',
      subject: { type: 'connection', id },
      details: { name: row.name, passed: counts.passed, total: results.length },
    });
    return toRunResponse(saved);
  }

  async listRuns(id: string, page: number, limit: number): Promise<ConnectionRunListResponse> {
    await this.find(id);
    const { rows, total } = await this.runs.list(id, page, limit);
    return { items: rows.map(toRunSummary), total, page, pageSize: limit };
  }

  async getRun(runId: string): Promise<ConnectionRunResponse> {
    const row = await this.runs.findById(runId);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return toRunResponse(row);
  }

  /** What a sealed value is tied to, so one organisation’s credentials cannot be opened as another’s. */
  private context(): string {
    return `${currentOrganizationId()}:connection`;
  }

  private credentialsOf(row: Connection): AzureCredentials {
    return JSON.parse(this.secrets.open(row.credentials, this.context())) as AzureCredentials;
  }

  private async confirmWorks(credentials: AzureCredentials): Promise<void> {
    try {
      await this.azure.verify(credentials);
    } catch (error) {
      throw new AppException('CONNECTION_FAILED', HttpStatus.BAD_REQUEST, {
        reason: failureOf(error),
      });
    }
  }

  private async refuseIfJustRun(id: string): Promise<void> {
    const last = await this.runs.lastRanAt(id);
    if (last && Date.now() - last.getTime() < CONNECTION_RUN_GAP_SECONDS * 1000) {
      throw new AppException('RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async find(id: string): Promise<Connection> {
    const row = await this.connections.findActive(id);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return row;
  }
}
