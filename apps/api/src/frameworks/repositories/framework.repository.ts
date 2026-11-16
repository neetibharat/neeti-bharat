import { Injectable } from '@nestjs/common';
import { orgKey, orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Framework } from '../../generated/prisma/client';
import { nextSortOrder } from '../utils/sort-order';

export interface FrameworkDetails {
  name: string;
  about: string;
  seal: string;
}

/** The frameworks a company follows, in the order they were set up. */
@Injectable()
export class FrameworkRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The frameworks that have not been archived, in order. */
  findActive(): Promise<Framework[]> {
    return this.prisma.db.framework.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findOne(id: string): Promise<Framework | null> {
    return this.prisma.db.framework.findUnique({ where: orgKey(id) });
  }

  /** Adds a framework of the company's own at the end of the list. */
  async create(data: FrameworkDetails & { id: string }): Promise<Framework> {
    const sortOrder = await nextSortOrder(() =>
      this.prisma.db.framework.aggregate({ _max: { sortOrder: true } }),
    );
    return this.prisma.db.framework.create({
      data: { ...data, ...orgOwned(), isBuiltIn: false, sortOrder },
    });
  }

  update(id: string, data: FrameworkDetails): Promise<Framework> {
    return this.prisma.db.framework.update({ where: orgKey(id), data });
  }

  setArchived(id: string, archivedAt: Date | null): Promise<Framework> {
    return this.prisma.db.framework.update({ where: orgKey(id), data: { archivedAt } });
  }
}
