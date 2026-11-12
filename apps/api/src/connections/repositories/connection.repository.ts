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
