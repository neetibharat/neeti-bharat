import { Injectable } from '@nestjs/common';
import type {
  ActivityAction,
  ActivityEventResponse,
  ActivityListResponse,
  ActivityValue,
  ActivityVerifyResponse,
} from '@dpdp-kit/shared';
import type { ActivityAnchor, ActivityEvent } from '../../generated/prisma/client';
import { ActivityRepository, type ListQuery } from '../repositories/activity.repository';
import { fingerprint } from '../utils/fingerprint';

type Values = Record<string, ActivityValue>;

export interface ActivityActor {
  /** Missing for things nobody signed in to do, such as the system itself. */
  id?: string;
  label: string;
}

export interface RecordInput {
  actor: ActivityActor;
  action: ActivityAction;
  subject?: { type: string; id?: string };
  /** What the sentence for this action fills in. Keep personal data to what is needed to say who or what. */
  details?: Values;
  before?: Values;
  after?: Values;
}

const VERIFY_BATCH = 500;

interface ChainWalk {
  checked: number;
  reachedAnchor: boolean;
  brokenAt?: string;
}

@Injectable()
export class ActivityService {
  constructor(private readonly repository: ActivityRepository) {}

  /** Writes one change to the log. Call it from the service that makes the change. */
  async record(input: RecordInput): Promise<void> {
    await this.repository.append((previousHash) => {
      const event = toEvent(input);
      return { ...event, prevHash: previousHash, hash: fingerprint(previousHash, event) };
    });
  }

  async list(query: ListQuery): Promise<ActivityListResponse> {
    const { rows, total } = await this.repository.list(query);
    return { items: rows.map(toResponse), total, page: query.page, pageSize: query.limit };
  }

  /**
   * Recomputes every fingerprint from the oldest event on, then checks that the chain reaches the anchor.
   * The first event is taken as the start, because the ones before it may have been deleted by the retention job.
   * The anchor is read first: events written during the check lie after it, so they cannot count against it.
   */
  async verify(): Promise<ActivityVerifyResponse> {
    const anchor = await this.repository.findAnchor();
    const walk = await this.walkChain(anchor);
    if (walk.brokenAt) return { ok: false, checked: walk.checked, brokenAt: walk.brokenAt };
    const endsWhereItShould = anchor ? walk.reachedAnchor : walk.checked === 0;
    return endsWhereItShould
      ? { ok: true, checked: walk.checked }
      : { ok: false, checked: walk.checked, truncated: true };
  }

  private async walkChain(anchor: ActivityAnchor | null): Promise<ChainWalk> {
    const walk: ChainWalk = { checked: 0, reachedAnchor: false };
    let previous: ActivityEvent | null = null;
    for (let after: bigint | null = null; ;) {
      const batch = await this.repository.chainBatch(after, VERIFY_BATCH);
      if (batch.length === 0) return walk;
      for (const row of batch) {
        if (!isIntact(row, previous) || disagreesWithAnchor(row, anchor)) {
          return { ...walk, brokenAt: row.id };
        }
        walk.reachedAnchor ||= anchor?.lastSeq === row.seq;
        walk.checked += 1;
        previous = row;
      }
      after = batch.at(-1)!.seq;
    }
  }
}

function toEvent(input: RecordInput) {
  return {
    occurredAt: new Date(),
    action: input.action,
    ...actorColumns(input.actor),
    ...subjectColumns(input.subject),
    details: input.details ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
  };
}

function actorColumns(actor: ActivityActor) {
  return { actorId: actor.id ?? null, actorLabel: actor.label };
}

function subjectColumns(subject: RecordInput['subject']) {
  return { subjectType: subject?.type ?? null, subjectId: subject?.id ?? null };
}

/** The event the anchor names must be the one stored under that number. */
function disagreesWithAnchor(row: ActivityEvent, anchor: ActivityAnchor | null): boolean {
  return anchor?.lastSeq === row.seq && anchor.lastHash !== row.hash;
}

function isIntact(row: ActivityEvent, previous: ActivityEvent | null): boolean {
  if (previous && row.prevHash !== previous.hash) return false;
  return row.hash === fingerprint(row.prevHash, row);
}

function toResponse(row: ActivityEvent): ActivityEventResponse {
  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    actorLabel: row.actorLabel,
    action: row.action as ActivityAction,
    details: row.details as Values | null,
    before: row.before as Values | null,
    after: row.after as Values | null,
  };
}
