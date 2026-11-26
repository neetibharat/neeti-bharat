import { READINESS_QUESTIONS, scoreReadiness, type ReadinessAnswers } from '@neeti-bharat/shared';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import type { ReadinessCheck } from '../../generated/prisma/client';
import type { ReadinessRepository } from '../repositories/readiness.repository';
import { ReadinessService } from './readiness.service';

const actor = { id: 'u1', label: 'Asha' };
const answersOf = (answer: 'yes' | 'partly' | 'no'): ReadinessAnswers =>
  Object.fromEntries(READINESS_QUESTIONS.map((question) => [question.id, answer]));

const row = (over: Partial<ReadinessCheck> = {}): ReadinessCheck => ({
  id: 'r1',
  organizationId: 'o1',
  takenAt: new Date('2026-11-12T10:00:00Z'),
  takenByName: 'Asha',
  answers: answersOf('yes') as never,
  score: 100,
  ...over,
});

function build(rows: ReadinessCheck[] = []) {
  const checks = {
    create: vi.fn(async (data) => row({ ...data, id: 'new' })),
    findRecent: vi.fn().mockResolvedValue(rows),
  };
  const activity = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new ReadinessService(
    checks as unknown as ReadinessRepository,
    activity as unknown as ActivityService,
  );
  return { service, checks, activity };
}

describe('ReadinessService.take', () => {
  it('works the score out itself and keeps the answers', async () => {
    const { service, checks } = build();
    const result = await service.take(answersOf('partly'), actor);

    expect(checks.create).toHaveBeenCalledWith({
      takenByName: 'Asha',
      answers: answersOf('partly'),
      score: 50,
    });
    expect(result.score).toBe(50);
    expect(result.domains).toEqual(scoreReadiness(answersOf('partly')).domains);
  });

  it('writes the check to the activity log with its score', async () => {
    const { service, activity } = build();
    await service.take(answersOf('no'), actor);
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'READINESS_CHECKED',
        subject: { type: 'readiness_check', id: 'new' },
        details: { score: 0 },
      }),
    );
  });
});

describe('ReadinessService.get', () => {
  it('has nothing until a check has been taken', async () => {
    expect(await build().service.get()).toEqual({ latest: null, history: [] });
  });

  it('gives the newest check in full and the scores of the recent ones', async () => {
    const newest = row({ id: 'r2', score: 80 });
    const older = row({ id: 'r1', score: 40, takenAt: new Date('2026-11-01T10:00:00Z') });
    const { latest, history } = await build([newest, older]).service.get();

    expect(latest).toMatchObject({ id: 'r2', score: 80 });
    expect(latest?.answers).toEqual(answersOf('yes'));
    expect(latest?.domains).toHaveLength(8);
    expect(history.map((check) => [check.id, check.score])).toEqual([
      ['r2', 80],
      ['r1', 40],
    ]);
    expect(history[0]).not.toHaveProperty('answers');
  });
});
