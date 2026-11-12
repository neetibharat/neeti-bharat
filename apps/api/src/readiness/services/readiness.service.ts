import { Injectable } from '@nestjs/common';
import {
  READINESS_HISTORY_LIMIT,
  scoreReadiness,
  type ReadinessAnswers,
  type ReadinessCheckResponse,
  type ReadinessCheckSummary,
  type ReadinessResponse,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import type { ReadinessCheck } from '../../generated/prisma/client';
import { ReadinessRepository } from '../repositories/readiness.repository';

const toSummary = (row: ReadinessCheck): ReadinessCheckSummary => ({
  id: row.id,
  takenAt: row.takenAt.toISOString(),
  takenByName: row.takenByName,
  score: row.score,
});

// The answers were checked and written by this service, so they are read back as they were saved.
const toResponse = (row: ReadinessCheck): ReadinessCheckResponse => {
  const answers = row.answers as unknown as ReadinessAnswers;
  return { ...toSummary(row), answers, domains: scoreReadiness(answers).domains };
};

@Injectable()
export class ReadinessService {
  constructor(
    private readonly checks: ReadinessRepository,
    private readonly activity: ActivityService,
  ) {}

  /** The latest check in full, and the scores of the recent ones. */
  async get(): Promise<ReadinessResponse> {
    const rows = await this.checks.findRecent(READINESS_HISTORY_LIMIT);
    return { latest: rows[0] ? toResponse(rows[0]) : null, history: rows.map(toSummary) };
  }

  /** Scores the answers on the server, so the score cannot be sent in, and keeps the check. */
  async take(answers: ReadinessAnswers, actor: ActivityActor): Promise<ReadinessCheckResponse> {
    const { score } = scoreReadiness(answers);
    const row = await this.checks.create({ takenByName: actor.label, answers, score });
    await this.activity.record({
      actor,
      action: 'READINESS_CHECKED',
      subject: { type: 'readiness_check', id: row.id },
      details: { score },
    });
    return toResponse(row);
  }
}
