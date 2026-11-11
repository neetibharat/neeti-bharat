import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { Requirement } from '../../generated/prisma/client';
import { nextSortOrder } from '../utils/sort-order';

export interface RequirementDetails {
  reference: string;
  title: string;
  summary: string;
}

export interface NewRequirement extends RequirementDetails {
  id: string;
  frameworkId: string;
}

/** The rules of a framework, in the order the law lists them. */
@Injectable()
export class RequirementRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The rules that have not been archived, in order. */
  findActive(frameworkId: string): Promise<Requirement[]> {
    return this.prisma.db.requirement.findMany({
      where: { frameworkId, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** Every rule of every framework that has not been archived, for working out where a control sits. */
  findAllActive(): Promise<Requirement[]> {
    return this.prisma.db.requirement.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findOne(id: string): Promise<Requirement | null> {
    return this.prisma.db.requirement.findUnique({ where: { id } });
  }

  /** Adds a rule at the end of its framework's list. */
  async create(data: NewRequirement): Promise<Requirement> {
    const sortOrder = await nextSortOrder(() =>
      this.prisma.db.requirement.aggregate({
        where: { frameworkId: data.frameworkId },
        _max: { sortOrder: true },
      }),
    );
    return this.prisma.db.requirement.create({
      data: { ...data, sortOrder },
    });
  }

  update(id: string, data: RequirementDetails): Promise<Requirement> {
    return this.prisma.db.requirement.update({ where: { id }, data });
  }

  setArchived(id: string, archivedAt: Date | null): Promise<Requirement> {
    return this.prisma.db.requirement.update({ where: { id }, data: { archivedAt } });
  }
}
