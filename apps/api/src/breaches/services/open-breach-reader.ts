import { Injectable } from '@nestjs/common';
import type { BreachStep } from '@dpdp-kit/shared';
import { ProfileService } from '../../profile/services/profile.service';
import { BreachRepository } from '../repositories/breach.repository';
import { reportWindowOf } from '../utils/breach-clock';
import { stateOf } from '../utils/breach-view';

/** The little of an open breach that makes it work for someone. */
export interface OpenBreach {
  id: string;
  title: string;
  currentStep: BreachStep;
  reportDueAt: Date;
  overdue: boolean;
  /** Who deals with it, or null when it is the DPO's. */
  assigneeId: string | null;
}

/** Read-only view of the breaches that are not closed, for modules that give work to a person. */
@Injectable()
export class OpenBreachReader {
  constructor(
    private readonly breaches: BreachRepository,
    private readonly profile: ProfileService,
  ) {}

  async open(): Promise<OpenBreach[]> {
    const [rows, { entries }] = await Promise.all([this.breaches.findOpen(), this.profile.list()]);
    const clock = { windowMs: reportWindowOf(entries), now: new Date() };
    return rows.flatMap((row) => {
      const { currentStep, reportDueAt, overdue } = stateOf(row, clock);
      return currentStep
        ? [
            {
              id: row.id,
              title: row.title,
              currentStep,
              reportDueAt,
              overdue,
              assigneeId: row.assignee?.id ?? null,
            },
          ]
        : [];
    });
  }
}
