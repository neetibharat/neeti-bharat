import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../core/prisma/prisma.service';
import { PeopleRepository } from './people.repository';

const cleared = (count: number) => ({ updateMany: vi.fn().mockResolvedValue({ count }) });

/** A stand-in database that runs the transaction callback and counts what each table cleared. */
function build() {
  const db = {
    roleAssignment: {
      findMany: vi.fn().mockResolvedValue([{ role: 'DPO' }]),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    control: cleared(2),
    proofRequirement: cleared(3),
    breach: cleared(4),
    dataRequest: cleared(5),
    policy: cleared(6),
    person: { update: vi.fn().mockResolvedValue({}) },
  };
  const prisma = { transact: (work: (tx: typeof db) => unknown) => work(db) };
  return { db, repository: new PeopleRepository(prisma as unknown as PrismaService) };
}

describe('PeopleRepository.markLeft', () => {
  it('takes the person off breaches and requests and counts them with the other assignments', async () => {
    const { db, repository } = build();
    const outcome = await repository.markLeft('p1', new Date('2026-11-10T00:00:00Z'));
    expect(db.breach.updateMany).toHaveBeenCalledWith({
      where: { assigneeId: 'p1' },
      data: { assigneeId: null },
    });
    expect(db.dataRequest.updateMany).toHaveBeenCalledWith({
      where: { assigneeId: 'p1' },
      data: { assigneeId: null },
    });
    expect(outcome).toEqual({ roles: ['DPO'], assignments: 2 + 3 + 4 + 5 + 6 });
  });
});
