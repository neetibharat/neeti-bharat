import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma, type ActivityAnchor, type ActivityEvent } from '../../generated/prisma/client';

/** Any fixed number: writers take turns on this lock so the chain never forks. */
const CHAIN_LOCK = 7_231_001;

/** The anchor is one row. */
const ANCHOR_ID = 1;

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
  limit: number;
  cursor?: string;
  action?: string;
}

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Adds one event to the end of the chain and moves the anchor to it, together. `build` gets the fingerprint of the current last event. */
  append(build: (previousHash: string | null) => NewActivityEvent): Promise<ActivityEvent> {
    return this.prisma.transact(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CHAIN_LOCK})`;
      const last = await tx.activityEvent.findFirst({
        orderBy: { seq: 'desc' },
        select: { hash: true },
      });
      const event = build(last?.hash ?? null);
      const created = await tx.activityEvent.create({
        data: {
          ...event,
          details: column(event.details),
          before: column(event.before),
          after: column(event.after),
        },
      });
      const head = { lastSeq: created.seq, lastHash: created.hash };
      await tx.activityAnchor.upsert({
        where: { id: ANCHOR_ID },
        create: { id: ANCHOR_ID, ...head },
        update: head,
      });
      return created;
    });
  }

  /** Newest first. Asks for one more than `limit` so the caller can tell whether there is a next page. */
  list({ limit, cursor, action }: ListQuery): Promise<ActivityEvent[]> {
    return this.prisma.db.activityEvent.findMany({
      where: action ? { action } : undefined,
      orderBy: { seq: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { seq: BigInt(cursor) }, skip: 1 } : {}),
    });
  }

  /** Where the chain should end, or null before the first event. */
  findAnchor(): Promise<ActivityAnchor | null> {
    return this.prisma.db.activityAnchor.findUnique({ where: { id: ANCHOR_ID } });
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
