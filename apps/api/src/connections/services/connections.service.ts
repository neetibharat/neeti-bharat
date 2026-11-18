import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CONNECTION_RUN_GAP_SECONDS,
  type ConnectionListResponse,
  type ConnectionProvider,
  type ConnectionRunListResponse,
  type ConnectionRunResponse,
  type ConnectionSummary,
  type GithubSelection,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { currentOrganizationId } from '../../core/org/org-context';
import { SecretBox } from '../../core/secrets/secret-box';
import type { Connection } from '../../generated/prisma/client';
import type { CreateConnectionInput, UpdateConnectionInput } from '../dto/connection.dto';
import type { Credentials } from '../providers/connection-driver';
import { ConnectionDrivers } from '../providers/connection-drivers';
import { selectionOf } from '../providers/github/github-driver';
import { tally } from '../providers/outcome';
import { ConnectionRunRepository } from '../repositories/connection-run.repository';
import { ConnectionRepository } from '../repositories/connection.repository';
import { failureOf, toRunResponse, toRunSummary, toSummary } from '../utils/connection-mapper';

/** The fields of the credentials that may be replaced, for each system. The rest identify what is read, and stay. */
const EDITABLE: Record<ConnectionProvider, readonly string[]> = {
  azure: ['tenantId', 'clientId', 'clientSecret'],
  github: ['privateKey'],
};

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly connections: ConnectionRepository,
    private readonly runs: ConnectionRunRepository,
    private readonly secrets: SecretBox,
    private readonly drivers: ConnectionDrivers,
    private readonly activity: ActivityService,
  ) {}

  async list(page: number, limit: number): Promise<ConnectionListResponse> {
    const [{ rows, total }, counts] = await Promise.all([
      this.connections.list(page, limit),
      this.connections.countsByProvider(),
    ]);
    const latest = await this.connections.latestRuns(rows.map((row) => row.id));
    const byConnection = new Map(latest.map((run) => [run.connectionId, run]));
    return {
      enabled: this.secrets.isEnabled(),
      items: rows.map((row) => toSummary(row, byConnection.get(row.id))),
      counts,
      total,
      page,
      pageSize: limit,
    };
  }

  /** One connection with its latest run, for its own page. */
  async get(id: string): Promise<ConnectionSummary> {
    const row = await this.find(id);
    const [latest] = await this.connections.latestRuns([id]);
    return toSummary(row, latest);
  }

  /** Signs in with the details to see that they work, then keeps them sealed. Nothing is kept if they do not work. */
  async create(input: CreateConnectionInput, actor: ActivityActor): Promise<ConnectionSummary> {
    if (!this.secrets.isEnabled()) {
      throw new AppException('SECRETS_NOT_CONFIGURED', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const selection = input.provider === 'github' ? input.repositories : undefined;
    const identifiers = await this.verify(input.provider, input.credentials, selection);
    const row = await this.connections.createWith(
      {
        provider: input.provider,
        name: input.name,
        identifiers,
        credentials: this.secrets.seal(JSON.stringify(input.credentials), this.context()),
        createdByName: actor.label,
      },
      (created) =>
        this.activity.record({
          actor,
          action: 'CONNECTION_ADDED',
          subject: { type: 'connection', id: created.id },
          details: { name: created.name, provider: created.provider },
        }),
    );
    return toSummary(row, undefined);
  }

  /**
   * A new name, and any new details or repositories. New details are tried first, and nothing changes if they do not
   * work.
   */
  async update(
    id: string,
    input: UpdateConnectionInput,
    actor: ActivityActor,
  ): Promise<ConnectionSummary> {
    const row = await this.find(id);
    const provider = row.provider as ConnectionProvider;
    this.refuseForeignFields(provider, input);
    const changes = input.credentials ?? {};
    const detailsChanged = Object.keys(changes).length > 0;
    const credentials = { ...this.credentialsOf(row), ...changes };
    const identifiers =
      detailsChanged || input.repositories
        ? await this.verify(
            provider,
            credentials,
            input.repositories ?? selectionOf(this.identifiersOf(row)),
          )
        : undefined;
    const saved = await this.connections.updateWith(
      id,
      {
        name: input.name,
        ...(identifiers && { identifiers }),
        ...(detailsChanged && {
          credentials: this.secrets.seal(JSON.stringify(credentials), this.context()),
        }),
      },
      (updated) =>
        this.activity.record({
          actor,
          action: 'CONNECTION_UPDATED',
          subject: { type: 'connection', id },
          details: { name: updated.name, details: detailsChanged },
        }),
    );
    const [latest] = await this.connections.latestRuns([id]);
    return toSummary(saved, latest);
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
    const provider = row.provider as ConnectionProvider;
    await this.refuseIfJustRun(id);
    const credentials = this.credentialsOf(row);
    const identifiers = await this.verify(
      provider,
      credentials,
      selectionOf(this.identifiersOf(row)),
    );
    const results = await this.drivers.byProvider[provider].check(credentials, identifiers);
    const counts = tally(results);
    // Nothing is held open while the system is read: the run and its log entry are saved together only now.
    const saved = await this.runs.createWith(
      { connectionId: id, ranByName: actor.label, results, ...counts },
      () =>
        this.activity.record({
          actor,
          action: 'CONNECTION_CHECKED',
          subject: { type: 'connection', id },
          details: { name: row.name, passed: counts.passed, total: results.length },
        }),
    );
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

  private credentialsOf(row: Connection): Credentials {
    return JSON.parse(this.secrets.open(row.credentials, this.context())) as Credentials;
  }

  private identifiersOf(row: Connection): Record<string, string> {
    return row.identifiers as Record<string, string>;
  }

  /** A change that names a detail the system does not let be replaced, such as an Azure subscription, is refused. */
  private refuseForeignFields(provider: ConnectionProvider, input: UpdateConnectionInput): void {
    const sent = Object.keys(input.credentials ?? {});
    const foreign = sent.some((field) => !EDITABLE[provider].includes(field));
    if (foreign || (input.repositories && provider !== 'github')) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    }
  }

  /** Tries the details with the system, and gives what to keep in the clear. Says why when it does not work. */
  private async verify(
    provider: ConnectionProvider,
    credentials: Credentials,
    selection?: GithubSelection,
  ): Promise<Record<string, string>> {
    try {
      return await this.drivers.byProvider[provider].verify(credentials, selection);
    } catch (error) {
      throw new AppException('CONNECTION_FAILED', HttpStatus.BAD_REQUEST, {
        reason: failureOf(error),
        provider,
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
