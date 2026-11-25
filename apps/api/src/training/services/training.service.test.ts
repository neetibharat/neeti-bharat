import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { PersonDirectory } from '../../people/services/person-directory';
import type { TrainingRepository, TrainingRow } from '../repositories/training.repository';
import { TrainingService } from './training.service';

const actor = { id: 'u1', label: 'Asha' };
const now = new Date('2026-11-20T10:30:00.000Z');

const row = (over: Partial<TrainingRow> = {}): TrainingRow =>
  ({
    id: 't1',
    name: 'Awareness',
    about: null,
    url: null,
    archivedAt: null,
    organizationId: 'o1',
    createdAt: now,
    updatedAt: now,
    _count: { completions: 0 },
    ...over,
  }) as TrainingRow;

function build(
  found: TrainingRow | null = row(),
  me: { id: string; name: string } | null = { id: 'p1', name: 'Asha' },
) {
  const trainings = {
    findById: vi.fn().mockResolvedValue(found),
    findByName: vi.fn().mockResolvedValue(null),
    findInUse: vi.fn().mockResolvedValue([]),
    findPerson: vi
      .fn()
      .mockResolvedValue({ id: 'p1', name: 'Asha', email: 'a@example.com', createdAt: now }),
    completionsOf: vi.fn().mockResolvedValue([]),
    complete: vi.fn().mockResolvedValue({}),
    reopen: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockImplementation(async () => row()),
  } as unknown as TrainingRepository;
  const directory = {
    findByEmail: vi.fn().mockResolvedValue(me),
    requireActive: vi.fn().mockResolvedValue({ id: 'p2', name: 'Ravi' }),
  } as unknown as PersonDirectory;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  return { service: new TrainingService(trainings, directory, activity), trainings, activity };
}

const user = { email: 'asha@example.com' };

describe('TrainingService.complete', () => {
  it('records it for the signed-in person and logs who took it', async () => {
    const { service, trainings, activity } = build();
    await service.complete('t1', undefined, user, actor, now);
    expect(trainings.complete).toHaveBeenCalledWith('t1', 'p1', now);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TRAINING_COMPLETED',
        details: { name: 'Awareness', person: 'Asha' },
      }),
    );
  });

  it('refuses a training that is archived', async () => {
    const { service, trainings } = build(row({ archivedAt: now }));
    await expect(service.complete('t1', undefined, user, actor, now)).rejects.toMatchObject({
      status: 409,
    });
    expect(trainings.complete).not.toHaveBeenCalled();
  });

  it('refuses a user who has no person at the company', async () => {
    const { service } = build(row(), null);
    await expect(service.complete('t1', undefined, user, actor, now)).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe('TrainingService.addStarters', () => {
  it('adds each suggested training the company does not have yet', async () => {
    const { service, trainings } = build();
    (trainings.findAll as unknown) = vi.fn().mockResolvedValue([]);
    (trainings.countPeople as unknown) = vi.fn().mockResolvedValue(0);
    await service.addStarters(actor);
    expect(trainings.create).toHaveBeenCalledTimes(4);
  });
});
