import { Injectable } from '@nestjs/common';
import type { BreachStep } from '@dpdp-kit/shared';
import { orgOwned } from '../../core/org/keys';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { BreachRow, BreachSummaryRow } from '../utils/breach-view';

/** The details of a breach that someone writes. */
export interface BreachDetails {
  title: string;
  description: string;
  foundAt: Date;
  affectedSystems: string;
  affectedData: string;
  peopleAffected: number | null;
  assigneeId: string | null;
}

export interface NewStep {
  step: BreachStep;
  completedAt: Date;
  completedByName: string;
  note?: string;
}

const summarySelect = {
  id: true,
  title: true,
  foundAt: true,
  peopleAffected: true,
  assignee: { select: { id: true, name: true } },
  steps: { select: { step: true, completedAt: true } },
} as const;

const fullInclude = { steps: true, assignee: { select: { id: true, name: true } } } as const;

/** A breach is open until its close step exists. */
const OPEN = { steps: { none: { step: 'close' as const } } };

@Injectable()
export class BreachRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Breaches whose title or description matches the search, with only what the list shows. */
  findForList(q?: string): Promise<BreachSummaryRow[]> {
    const search = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return this.prisma.db.breach.findMany({ where: search, select: summarySelect });
  }

  /** Every breach with only what the counts need. */
  findAllForCounts(): Promise<BreachSummaryRow[]> {
    return this.prisma.db.breach.findMany({ select: summarySelect });
  }

  findOpen(): Promise<BreachSummaryRow[]> {
    return this.prisma.db.breach.findMany({ where: OPEN, select: summarySelect });
  }

  findOne(id: string): Promise<BreachRow | null> {
    return this.prisma.db.breach.findUnique({ where: { id }, include: fullInclude });
  }

  /** Saves the breach together with its first step, found. */
  create(details: BreachDetails, found: NewStep, reportedByName: string): Promise<BreachRow> {
    const { step, ...rest } = found;
    return this.prisma.db.breach.create({
      data: {
        ...details,
        reportedByName,
        ...orgOwned(),
        steps: { create: { step, ...rest, ...orgOwned() } },
      },
      include: fullInclude,
    });
  }

  /** Changes the details. The found step moves with the time found. */
  update(id: string, details: BreachDetails): Promise<BreachRow> {
    return this.prisma.db.breach.update({
      where: { id },
      data: {
        ...details,
        steps: { updateMany: { where: { step: 'found' }, data: { completedAt: details.foundAt } } },
      },
      include: fullInclude,
    });
  }

  async addStep(breachId: string, step: NewStep): Promise<void> {
    await this.prisma.db.breachStepRecord.create({
      data: { breachId, ...step, ...orgOwned() },
    });
  }
}
