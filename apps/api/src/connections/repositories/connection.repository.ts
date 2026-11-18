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
