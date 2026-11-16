import { Injectable } from '@nestjs/common';
import { currentOrganizationId } from '../../core/org/org-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma, type ActivityAnchor, type ActivityEvent } from '../../generated/prisma/client';

/** Any fixed number: writers to one organisation's chain take turns on this lock, so the chain never forks. */
const CHAIN_LOCK = 7_231_001;

type JsonValues = Record<string, string | number | boolean | null> | null;

/** One event ready to store. An empty JSON column is plain `null` here; the repository turns it into what Prisma wants. */
export interface NewActivityEvent {
  occurredAt: Date;
  action: string;
  actorId: string | null;
  actorLabel: string;
  subjectType: string | null;
  subjectId: string | null;
  details: JsonValues;
  before: JsonValues;
  after: JsonValues;
  prevHash: string | null;
  hash: string;
}

/** Prisma wants a marker, not null, to store an empty JSON column. */
const column = (value: JsonValues) => value ?? Prisma.DbNull;

export interface ListQuery {
  page: number;
  limit: number;
  action?: string;
}

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds one event to the end of the organisation's chain and moves its anchor to it, together. `build` gets the
   * fingerprint of the current last event.
   */
  append(build: (previousHash: string | null) => NewActivityEvent): Promise<ActivityEvent> {
    const organizationId = currentOrganizationId();
    return this.prisma.transact(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CHAIN_LOCK}, hashtext(${organizationId}))`;
      const last = await tx.activityEvent.findFirst({
        orderBy: { seq: 'desc' },
        select: { hash: true },
      });
      const event = build(last?.hash ?? null);
      const created = await tx.activityEvent.create({
        data: {
          ...event,
          organizationId,
          details: column(event.details),
          before: column(event.before),
          after: column(event.after),
        },
      });
      const head = { lastSeq: created.seq, lastHash: created.hash };
      await tx.activityAnchor.upsert({
        where: { organizationId },
        create: { organizationId, ...head },
        update: head,
      });
      return created;
    });
  }

  /** One page, newest first, and how many events match in all. */
  async list({
    page,
    limit,
    action,
  }: ListQuery): Promise<{ rows: ActivityEvent[]; total: number }> {
    const where = action ? { action } : undefined;
    const [rows, total] = await Promise.all([
      this.prisma.db.activityEvent.findMany({
        where,
        orderBy: { seq: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.db.activityEvent.count({ where }),
    ]);
    return { rows, total };
  }

  /** Where the chain should end, or null before the first event. */
  findAnchor(): Promise<ActivityAnchor | null> {
    return this.prisma.db.activityAnchor.findUnique({
      where: { organizationId: currentOrganizationId() },
    });
  }

  /** Oldest first, in batches, for checking the chain. */
  chainBatch(afterSeq: bigint | null, size: number): Promise<ActivityEvent[]> {
    return this.prisma.db.activityEvent.findMany({
      orderBy: { seq: 'asc' },
      take: size,
      ...(afterSeq === null ? {} : { cursor: { seq: afterSeq }, skip: 1 }),
    });
  }
}
