import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type { Connection, ConnectionRun } from '../../generated/prisma/client';
import { orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface NewConnection {
  provider: string;
  name: string;
  identifiers: Record<string, string>;
  /** Already sealed. */
  credentials: string;
  createdByName: string;
}

export interface ConnectionChanges {
  name: string;
  /** Both are set together, and only when the details changed. */
  identifiers?: Record<string, string>;
  credentials?: string;
}

/** Connections that have not been removed. A removed one keeps its row and its runs, and loses its credentials. */
const active = { removedAt: null } satisfies Prisma.ConnectionWhereInput;

@Injectable()
export class ConnectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewConnection): Promise<Connection> {
    return this.prisma.db.connection.create({
      data: { ...data, ...orgOwned(), identifiers: data.identifiers },
    });
  }

  /**
   * Saves the connection and whatever has to be saved with it, such as its activity log entry, together or not at all.
   * It opens the transaction itself, because adding a connection tries the details with Azure first, and a transaction
   * held open while that waits could expire.
   */
  createWith(
    data: NewConnection,
    alongside: (connection: Connection) => Promise<void>,
  ): Promise<Connection> {
    return this.prisma.runInTransaction(async () => {
      const connection = await this.create(data);
      await alongside(connection);
      return connection;
    });
  }

  /** Saves the changes and whatever goes with them in a transaction of its own, for the reason `createWith` gives. */
  updateWith(
    id: string,
    data: ConnectionChanges,
    alongside: (connection: Connection) => Promise<void>,
  ): Promise<Connection> {
    return this.prisma.runInTransaction(async () => {
      await this.prisma.db.connection.updateMany({ where: { id, ...active }, data });
      const connection = await this.prisma.db.connection.findFirstOrThrow({
        where: { id, ...active },
      });
      await alongside(connection);
      return connection;
    });
  }

  /** Saves how often the connection is checked, and whatever goes with it, together or not at all. */
  async setScheduleWith(
    id: string,
    schedule: string,
    alongside: (connection: Connection) => Promise<void>,
  ): Promise<Connection> {
    await this.prisma.db.connection.updateMany({ where: { id, ...active }, data: { schedule } });
    const connection = await this.prisma.db.connection.findFirstOrThrow({
      where: { id, ...active },
    });
    await alongside(connection);
    return connection;
  }

  /** The organisations that are still open. Organisations are not scoped, so this works outside a request. */
  openOrganizations(): Promise<{ id: string }[]> {
    return this.prisma.db.organization.findMany({
      where: { closedAt: null },
      select: { id: true },
    });
  }

  /** The connections that are checked on a schedule. */
  scheduled(): Promise<Connection[]> {
    return this.prisma.db.connection.findMany({
      where: { ...active, schedule: { not: 'off' } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Takes this try for the schedule, unless one was taken since `before`. Only the caller that gets true goes on, so two
   * copies of the API never check the same connection twice.
   */
  async claimAttempt(id: string, before: Date, now: Date): Promise<boolean> {
    const { count } = await this.prisma.db.connection.updateMany({
      where: {
        id,
        ...active,
        schedule: { not: 'off' },
        OR: [{ lastAttemptAt: null }, { lastAttemptAt: { lt: before } }],
      },
      data: { lastAttemptAt: now },
    });
    return count === 1;
  }

  /** Notes that a try could not sign in, with whatever goes with it, together or not at all. */
  failScheduleWith(id: string, at: Date, alongside: () => Promise<void>): Promise<void> {
    return this.prisma.runInTransaction(async () => {
      await this.setScheduleFailure(id, at);
      await alongside();
    });
  }

  /** Notes that a try could not sign in, or clears the note with null when a check worked. */
  async setScheduleFailure(id: string, at: Date | null): Promise<void> {
    await this.prisma.db.connection.updateMany({
      where: { id, ...active },
      data: { scheduleFailedAt: at },
    });
  }

  findActive(id: string): Promise<Connection | null> {
    return this.prisma.db.connection.findFirst({ where: { id, ...active } });
  }

  async list(page: number, limit: number) {
    const [rows, total] = await Promise.all([
      this.prisma.db.connection.findMany({
        where: active,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.db.connection.count({ where: active }),
    ]);
    return { rows, total };
  }

  /** How many connections there are of each kind. */
  async countsByProvider(): Promise<Record<string, number>> {
    const rows = await this.prisma.db.connection.findMany({
      where: active,
      select: { provider: true },
    });
    const counts: Record<string, number> = {};
    for (const { provider } of rows) counts[provider] = (counts[provider] ?? 0) + 1;
    return counts;
  }

  /** The newest run of each of these connections. */
  latestRuns(connectionIds: string[]): Promise<ConnectionRun[]> {
    return this.prisma.db.connectionRun.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: [{ connectionId: 'asc' }, { ranAt: 'desc' }],
      distinct: ['connectionId'],
    });
  }

  async remove(id: string, now: Date): Promise<void> {
    await this.prisma.db.connection.updateMany({
      where: { id, ...active },
      data: { removedAt: now, credentials: '' },
    });
  }
}
