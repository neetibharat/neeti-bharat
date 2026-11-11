import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/** How many log events are read at a time, so the whole log is never held at once. */
export const ACTIVITY_BATCH = 1000;

/** Whole-table reads for downloads. Nothing here is paged, because a download is the complete record. */
@Injectable()
export class ExportRepository {
  constructor(private readonly prisma: PrismaService) {}

  breaches() {
    return this.prisma.db.breach.findMany({
      orderBy: { foundAt: 'asc' },
      include: { steps: true, assignee: { select: { name: true } } },
    });
  }

  requests() {
    return this.prisma.db.dataRequest.findMany({
      orderBy: { number: 'asc' },
      include: { tasks: { orderBy: { createdAt: 'asc' } }, assignee: { select: { name: true } } },
    });
  }

  people() {
    return this.prisma.db.person.findMany({
      orderBy: { name: 'asc' },
      include: { roles: { select: { role: true } } },
    });
  }

  accounts(emails: string[]) {
    return this.prisma.db.user.findMany({
      where: { email: { in: emails } },
      select: { email: true, role: true, disabledAt: true },
    });
  }

  evidence() {
    return this.prisma.db.evidence.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        control: { select: { id: true, title: true } },
        proofRequirement: { select: { title: true } },
      },
    });
  }

  proofRequirements() {
    return this.prisma.db.proofRequirement.findMany({
      where: { archivedAt: null, control: { archivedAt: null } },
      orderBy: [{ controlId: 'asc' }, { sortOrder: 'asc' }],
      include: {
        control: { select: { id: true, title: true } },
        assignee: { select: { name: true } },
        evidence: { select: { createdAt: true } },
      },
    });
  }

  policies() {
    return this.prisma.db.policy.findMany({
      where: { archivedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        approver: { select: { name: true } },
        approvals: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
  }

  /** The log, oldest first, after the given position. */
  activityAfter(seq: bigint | null) {
    return this.prisma.db.activityEvent.findMany({
      orderBy: { seq: 'asc' },
      take: ACTIVITY_BATCH,
      ...(seq === null ? {} : { where: { seq: { gt: seq } } }),
    });
  }
}
