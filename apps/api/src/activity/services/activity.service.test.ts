import { describe, expect, it } from 'vitest';
import { Prisma, type ActivityEvent } from '../../generated/prisma/client';
import type { ActivityRepository, NewActivityEvent } from '../repositories/activity.repository';
import { ActivityService } from './activity.service';

/** The database hands back null where Prisma was told to store an empty JSON column. */
function asStored(value: unknown) {
  return value === Prisma.DbNull ? null : value;
}

/** An in-memory stand-in for the table, with the same chaining rule as the real repository. */
function fakeRepository() {
  const rows: ActivityEvent[] = [];
  const anchor: { value: { lastSeq: bigint; lastHash: string } | null } = { value: null };
  const repository = {
    append: async (build: (previous: string | null) => NewActivityEvent) => {
      const data = build(rows.at(-1)?.hash ?? null) as unknown as ActivityEvent;
      const stored = {
        ...data,
        details: asStored(data.details),
        before: asStored(data.before),
        after: asStored(data.after),
      };
      const row = {
        ...stored,
        id: `e${rows.length + 1}`,
        seq: BigInt(rows.length + 1),
      } as ActivityEvent;
      rows.push(row);
      anchor.value = { lastSeq: row.seq, lastHash: row.hash };
      return row;
    },
    findAnchor: async () => anchor.value,
    list: async ({ limit, cursor }: { limit: number; cursor?: string }) =>
      [...rows]
        .reverse()
        .filter((row) => (cursor ? row.seq < BigInt(cursor) : true))
        .slice(0, limit + 1),
    chainBatch: async (after: bigint | null, size: number) =>
      rows.filter((row) => (after === null ? true : row.seq > after)).slice(0, size),
  } as unknown as ActivityRepository;
  return { rows, anchor, service: new ActivityService(repository) };
}

const actor = { id: 'u1', label: 'Asha' };

async function recordThree(service: ActivityService) {
  for (const email of ['a@company.in', 'b@company.in', 'c@company.in']) {
    await service.record({
      actor,
      action: 'INVITATION_CREATED',
      details: { email, role: 'member' },
    });
  }
}

describe('ActivityService.record', () => {
  it('links each event to the one before it', async () => {
    const { rows, service } = fakeRepository();
    await recordThree(service);
    expect(rows[0]!.prevHash).toBeNull();
    expect(rows[1]!.prevHash).toBe(rows[0]!.hash);
    expect(rows[2]!.prevHash).toBe(rows[1]!.hash);
  });
});

describe('ActivityService.list', () => {
  it('returns newest first, with a cursor only when there is more', async () => {
    const { service } = fakeRepository();
    await recordThree(service);
    const first = await service.list({ limit: 2 });
    expect(first.items.map((item) => item.details?.email)).toEqual([
      'c@company.in',
      'b@company.in',
    ]);
    expect(first.nextCursor).not.toBeNull();
    const second = await service.list({ limit: 2, cursor: first.nextCursor! });
    expect(second.items.map((item) => item.details?.email)).toEqual(['a@company.in']);
    expect(second.nextCursor).toBeNull();
  });
});

describe('ActivityService.verify', () => {
  it('passes for an untouched log, and for an empty one', async () => {
    const { service } = fakeRepository();
    expect(await service.verify()).toEqual({ ok: true, checked: 0 });
    await recordThree(service);
    expect(await service.verify()).toEqual({ ok: true, checked: 3 });
  });

  it('finds an event that was edited', async () => {
    const { rows, service } = fakeRepository();
    await recordThree(service);
    rows[1] = { ...rows[1]!, actorLabel: 'Someone else' };
    expect(await service.verify()).toEqual({ ok: false, checked: 1, brokenAt: 'e2' });
  });

  it('finds an event that was removed from the middle', async () => {
    const { rows, service } = fakeRepository();
    await recordThree(service);
    rows.splice(1, 1);
    expect(await service.verify()).toMatchObject({ ok: false, brokenAt: 'e3' });
  });

  it('finds events removed from the end, which leave a chain that still links up', async () => {
    const { rows, service } = fakeRepository();
    await recordThree(service);
    rows.pop();
    expect(await service.verify()).toEqual({ ok: false, checked: 2, truncated: true });
  });

  it('finds a log that was emptied', async () => {
    const { rows, service } = fakeRepository();
    await recordThree(service);
    rows.length = 0;
    expect(await service.verify()).toEqual({ ok: false, checked: 0, truncated: true });
  });

  it('finds the anchor missing from a log that has events', async () => {
    const { anchor, service } = fakeRepository();
    await recordThree(service);
    anchor.value = null;
    expect(await service.verify()).toEqual({ ok: false, checked: 3, truncated: true });
  });

  it('finds the newest event replaced by another with the same number', async () => {
    const { rows, service } = fakeRepository();
    await recordThree(service);
    rows[2] = { ...rows[2]!, hash: 'forged' };
    expect(await service.verify()).toMatchObject({ ok: false, brokenAt: 'e3' });
  });

  it('accepts events written after the anchor was read', async () => {
    const { rows, anchor, service } = fakeRepository();
    await recordThree(service);
    anchor.value = { lastSeq: rows[1]!.seq, lastHash: rows[1]!.hash };
    expect(await service.verify()).toEqual({ ok: true, checked: 3 });
  });

  it('accepts a log whose oldest events were purged by the retention job', async () => {
    const { rows, service } = fakeRepository();
    await recordThree(service);
    rows.shift();
    expect(await service.verify()).toEqual({ ok: true, checked: 2 });
  });
});
