import { Injectable } from '@nestjs/common';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { ExportRange } from '../dto/export-range.dto';
import { dateFilter } from '../utils/date-filter';

/** How many log events are read at a time, so the whole log is never held at once. */
export const ACTIVITY_BATCH = 1000;

/** What an event is about, as the log records it. */
export interface ActivitySubject {
  type: string;
  id: string;
}

/** Whole-table reads for downloads. Nothing here is paged, because a download is the complete record. */
@Injectable()
export class ExportRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The breaches found in the range, or all of them. */
  breaches(range?: ExportRange) {
    return this.prisma.db.breach.findMany({
      where: { foundAt: dateFilter(range) },
      orderBy: { foundAt: 'asc' },
      include: { steps: true, assignee: { select: { name: true } } },
    });
  }

  /** The requests received in the range, or all of them. */
  requests(range?: ExportRange) {
    return this.prisma.db.dataRequest.findMany({
      where: { receivedAt: dateFilter(range) },
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

  /** What each of these people may do in this organisation, and whether they have left it. */
  async accounts(emails: string[]) {
    const rows = await this.prisma.db.membership.findMany({
      where: { organizationId: currentOrganizationId(), user: { email: { in: emails } } },
      select: { role: true, disabledAt: true, user: { select: { email: true } } },
    });
    return rows.map((row) => ({
      email: row.user.email,
      role: row.role,
      disabledAt: row.disabledAt,
    }));
  }

  /** Every piece of proof, or only the proof on these controls, or only what was added in the range. */
  evidence(controlIds?: string[], range?: ExportRange) {
    return this.prisma.db.evidence.findMany({
      where: {
        ...(controlIds && { controlId: { in: controlIds } }),
        createdAt: dateFilter(range),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        control: { select: { id: true, title: true } },
        proofRequirement: { select: { title: true } },
      },
    });
  }

  /** What each control must prove, or only for these controls. */
  proofRequirements(controlIds?: string[]) {
    return this.prisma.db.proofRequirement.findMany({
      where: {
        archivedAt: null,
        control: { archivedAt: null },
        ...(controlIds && { controlId: { in: controlIds } }),
      },
      orderBy: [{ controlId: 'asc' }, { sortOrder: 'asc' }],
      include: {
        control: { select: { id: true, title: true } },
        assignee: { select: { name: true } },
        evidence: { select: { createdAt: true } },
      },
    });
  }

  /** Every policy that is in use, or only these. */
  policies(ids?: string[]) {
    return this.prisma.db.policy.findMany({
      where: { archivedAt: null, ...(ids && { id: { in: ids } }) },
      orderBy: { sortOrder: 'asc' },
      include: {
        approver: { select: { name: true } },
        approvals: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
  }

  /** The log, oldest first, after the given position. Given subjects, only the events about them. */
  activityAfter(seq: bigint | null, subjects?: ActivitySubject[], range?: ExportRange) {
    return this.prisma.db.activityEvent.findMany({
      orderBy: { seq: 'asc' },
      take: ACTIVITY_BATCH,
      where: {
        occurredAt: dateFilter(range),
        ...(seq !== null && { seq: { gt: seq } }),
        ...(subjects && {
          OR: subjects.map((subject) => ({ subjectType: subject.type, subjectId: subject.id })),
        }),
      },
    });
  }
}
