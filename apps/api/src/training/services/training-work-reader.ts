import { Injectable } from '@nestjs/common';
import { TrainingRepository } from '../repositories/training.repository';
import { trainingState } from '../utils/training-status';

/** One training that is waiting on one person: to take, or to take again. */
export interface WorkTraining {
  personId: string;
  id: string;
  name: string;
  dueOn: Date;
}

/** Read-only view of the trainings people still have to take, for modules that give work to a person. */
@Injectable()
export class TrainingWorkReader {
  constructor(private readonly trainings: TrainingRepository) {}

  /** Every training that is to do or due again soon, for each person who has not left. */
  async pending(now: Date): Promise<WorkTraining[]> {
    const inUse = await this.trainings.findInUse();
    if (inUse.length === 0) return [];
    const [people, completions] = await Promise.all([
      this.trainings.activePeopleAll(),
      this.trainings.completionsOfActive(inUse.map((training) => training.id)),
    ]);
    return people.flatMap((person) =>
      inUse.flatMap((training) => {
        const completedAt =
          completions.find((c) => c.trainingId === training.id && c.personId === person.id)
            ?.completedAt ?? null;
        const { status, dueOn } = trainingState({
          completedAt,
          repeatsYearly: training.repeatsYearly,
          trainingCreatedAt: training.createdAt,
          personCreatedAt: person.createdAt,
          now,
        });
        if (status === 'done' || !dueOn) return [];
        return [{ personId: person.id, id: training.id, name: training.name, dueOn }];
      }),
    );
  }
}
