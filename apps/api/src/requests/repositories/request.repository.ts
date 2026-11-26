import { Injectable } from '@nestjs/common';
import type { RequestSource, RequestStatus, RequestType, TaskOutcome } from '@neeti-bharat/shared';
import { orgOwned } from '../../core/org/keys';
import { currentOrganizationId } from '../../core/org/org-context';
import { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import { PrismaService } from '../../core/prisma/prisma.service';
import { listOrder, listWhere, type RequestListQuery } from '../utils/request-list';
import type { RequestBoardQuery } from '../utils/request-board';
import type { RequestRow, RequestSummaryRow } from '../utils/request-view';

/** What someone writes about a request. */
export interface RequestDetails {
  type: RequestType;
  personName: string;
  personEmail: string;
  details: string;
  assigneeId: string | null;
}

export interface NewRequest extends RequestDetails {
  source: RequestSource;
  receivedAt: Date;
  dueAt: Date;
  loggedByName: string;
}

const summarySelect = {
  id: true,
  number: true,
  type: true,
  personName: true,
  receivedAt: true,
  dueAt: true,
  status: true,
  closedAt: true,
  assignee: { select: { id: true, name: true } },
  tasks: { select: { outcome: true } },
} as const;

const fullInclude = {
  assignee: { select: { id: true, name: true } },
  tasks: { orderBy: { createdAt: 'asc' } },
} as const;

const OPEN = { status: { not: 'done' } } as const;

@Injectable()
export class RequestRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationRepository,
  ) {}

  /** One page of the requests a tab, type and search match, with only what the list shows. */
  findPage(query: RequestListQuery): Promise<RequestSummaryRow[]> {
    return this.prisma.db.dataRequest.findMany({
      where: listWhere(query),
      orderBy: listOrder(query.tab),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: summarySelect,
    });
  }

  /** The first cards of one column, in the order the list uses, narrowed by type and search. */
  findColumn(status: RequestStatus, query: RequestBoardQuery): Promise<RequestSummaryRow[]> {
    return this.prisma.db.dataRequest.findMany({
      where: listWhere({ tab: status, type: query.type, q: query.q }),
      orderBy: listOrder(status),
      take: query.limit,
      select: summarySelect,
    });
  }

  count(query: Pick<RequestListQuery, 'tab' | 'type' | 'q'>): Promise<number> {
    return this.prisma.db.dataRequest.count({ where: listWhere(query) });
  }

  async countByStatus(): Promise<{ status: RequestStatus; count: number }[]> {
    const groups = await this.prisma.db.dataRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return groups.map((group) => ({ status: group.status, count: group._count._all }));
  }

  countOverdue(now: Date): Promise<number> {
    return this.prisma.db.dataRequest.count({ where: { ...OPEN, dueAt: { lt: now } } });
  }

  /** Open requests due by a moment (so late ones too), the nearest first. */
  findDueBy(moment: Date, limit: number): Promise<RequestSummaryRow[]> {
    return this.prisma.db.dataRequest.findMany({
      where: { ...OPEN, dueAt: { lte: moment } },
      orderBy: { dueAt: 'asc' },
      take: limit,
      select: summarySelect,
    });
  }

  countDueBy(moment: Date): Promise<number> {
    return this.prisma.db.dataRequest.count({ where: { ...OPEN, dueAt: { lte: moment } } });
  }

  /** Every request that is not done, with only what My work needs. */
  findOpen(): Promise<
    {
      id: string;
      type: RequestType;
      personName: string;
      status: RequestStatus;
      dueAt: Date;
      assigneeId: string | null;
    }[]
  > {
    return this.prisma.db.dataRequest.findMany({
      where: OPEN,
      select: {
        id: true,
        type: true,
        personName: true,
        status: true,
        dueAt: true,
        assigneeId: true,
      },
    });
  }

  findOne(id: string): Promise<RequestRow | null> {
    return this.prisma.db.dataRequest.findUnique({ where: { id }, include: fullInclude });
  }

  /** Logs the request under the organisation's next REQ number. */
  async create(data: NewRequest): Promise<RequestRow> {
    const organizationId = currentOrganizationId();
    const number = await this.organizations.nextRequestNumber(organizationId);
    return this.prisma.db.dataRequest.create({
      data: { ...data, organizationId, number },
      include: fullInclude,
    });
  }

  async update(id: string, data: RequestDetails): Promise<void> {
    await this.prisma.db.dataRequest.update({ where: { id }, data });
  }

  async markIdentityVerified(
    id: string,
    data: { at: Date; byName: string; note?: string },
  ): Promise<void> {
    await this.prisma.db.dataRequest.update({
      where: { id },
      data: {
        status: 'in_progress',
        identityVerifiedAt: data.at,
        identityVerifiedByName: data.byName,
        identityNote: data.note ?? null,
      },
    });
  }

  async close(id: string, data: { at: Date; byName: string; replyNote: string }): Promise<void> {
    await this.prisma.db.dataRequest.update({
      where: { id },
      data: {
        status: 'done',
        closedAt: data.at,
        closedByName: data.byName,
        replyNote: data.replyNote,
      },
    });
  }

  async addTask(requestId: string, system: string): Promise<void> {
    await this.prisma.db.dataRequestTask.create({
      data: { requestId, system, ...orgOwned() },
    });
  }

  async updateTask(
    id: string,
    data: { outcome: TaskOutcome; reason: string | null },
  ): Promise<void> {
    await this.prisma.db.dataRequestTask.update({ where: { id }, data });
  }

  async removeTask(id: string): Promise<void> {
    await this.prisma.db.dataRequestTask.delete({ where: { id } });
  }
}
