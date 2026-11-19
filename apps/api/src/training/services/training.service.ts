import { HttpStatus, Injectable } from '@nestjs/common';
import {
  TRAINING_STARTERS,
  type ActivityAction,
  type MyTrainingResponse,
  type TeamTrainingResponse,
  type TrainingListResponse,
  type TrainingResponse,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { currentRole } from '../../core/org/org-context';
import { PersonDirectory } from '../../people/services/person-directory';
import type { AddTrainingInput, ListTeamQuery, UpdateTrainingInput } from '../dto/training.dto';
import {
  TrainingRepository,
  type PersonRow,
  type TrainingRow,
} from '../repositories/training.repository';
import { isTrained, toMyTraining, toTeamRow, toTrainingResponse } from '../utils/training-mapper';

@Injectable()
export class TrainingService {
  constructor(
    private readonly trainings: TrainingRepository,
    private readonly directory: PersonDirectory,
    private readonly activity: ActivityService,
  ) {}

  /** Every training, with how many of the people at the company have taken it. */
  async list(): Promise<TrainingListResponse> {
    const [rows, people] = await Promise.all([
      this.trainings.findAll(),
      this.trainings.countPeople(),
    ]);
    return { trainings: rows.map(toTrainingResponse), people };
  }

  /** What the signed-in person has to do, and what they have done. */
  async mine(user: { email: string }): Promise<MyTrainingResponse> {
    const me = await this.directory.findByEmail(user.email);
    if (!me) return { items: [], completeOn: null };
    return this.forPerson(me.id);
  }

  /** What one person has to do, and what they have done. For the person's own page. */
  async forPerson(personId: string): Promise<MyTrainingResponse> {
    const person = await this.trainings.findPerson(personId);
    if (!person) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    const [inUse, completions] = await Promise.all([
      this.trainings.findInUse(),
      this.trainings.completionsOf(person.id),
    ]);
    return toMyTraining(inUse, completions, person, new Date());
  }

  /** One page of people with how far each has got, and how many have done everything. */
  async team(query: ListTeamQuery): Promise<TeamTrainingResponse> {
    const now = new Date();
    const inUse = await this.trainings.findInUse();
    const ids = inUse.map((training) => training.id);
    const [{ rows, total }, everyone, completions] = await Promise.all([
      this.trainings.findPeoplePage(query),
      this.trainings.activePeopleAll(),
      this.trainings.completionsOfActive(ids),
    ]);
    const trained = everyone.filter((person) => isTrained(inUse, completions, person, now)).length;
    return {
      people: rows.map((person) => toTeamRow(person, inUse, completions, now)),
      total,
      page: query.page,
      pageSize: query.limit,
      trainings: inUse.length,
      trained,
      everyone: everyone.length,
    };
  }

  async add(input: AddTrainingInput, actor: ActivityActor): Promise<TrainingResponse> {
    await this.requireFreeName(input.name);
    const row = await this.trainings.create(input);
    await this.record(actor, 'TRAINING_ADDED', row);
    return toTrainingResponse(row);
  }

  /** The suggested trainings, except any the company already has by that name. */
  async addStarters(actor: ActivityActor): Promise<TrainingListResponse> {
    for (const starter of TRAINING_STARTERS) {
      if (await this.trainings.findByName(starter.name)) continue;
      await this.record(actor, 'TRAINING_ADDED', await this.trainings.create({ ...starter }));
    }
    return this.list();
  }

  async update(
    id: string,
    input: UpdateTrainingInput,
    actor: ActivityActor,
  ): Promise<TrainingResponse> {
    const current = await this.find(id);
    if (current.archivedAt) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    if (input.name) await this.requireFreeName(input.name, id);
    const row = await this.trainings.update(id, input);
    await this.record(actor, 'TRAINING_EDITED', row);
    return toTrainingResponse(row);
  }

  /** A training that is no longer asked for keeps its row, so who took it stays on record. */
  async archive(id: string, actor: ActivityActor, now: Date): Promise<TrainingResponse> {
    const current = await this.find(id);
    if (current.archivedAt) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    const row = await this.trainings.setArchived(id, now);
    await this.record(actor, 'TRAINING_ARCHIVED', row);
    return toTrainingResponse(row);
  }

  async restore(id: string, actor: ActivityActor): Promise<TrainingResponse> {
    const current = await this.find(id);
    if (!current.archivedAt) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    const row = await this.trainings.setArchived(id, null);
    await this.record(actor, 'TRAINING_RESTORED', row);
    return toTrainingResponse(row);
  }

  /** Records that a person has taken a training: yourself, or for someone else if you are an admin. */
  async complete(
    id: string,
    forPerson: string | undefined,
    user: { email: string },
    actor: ActivityActor,
    now: Date,
  ): Promise<MyTrainingResponse> {
    const person = await this.personFor(forPerson, user);
    const row = await this.requireInUse(id);
    await this.trainings.complete(id, person.id, now);
    await this.record(actor, 'TRAINING_COMPLETED', row, person.name);
    return this.forPerson(person.id);
  }

  /** Undoes a completion: for yourself, or for someone else if you are an admin. */
  async reopen(
    id: string,
    forPerson: string | undefined,
    user: { email: string },
    actor: ActivityActor,
  ): Promise<MyTrainingResponse> {
    const person = await this.personFor(forPerson, user);
    const row = await this.requireInUse(id);
    if (!(await this.trainings.reopen(id, person.id))) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    await this.record(actor, 'TRAINING_REOPENED', row, person.name);
    return this.forPerson(person.id);
  }

  /** The person a completion is for. Only an admin can name someone other than themselves. */
  private async personFor(
    forPerson: string | undefined,
    user: { email: string },
  ): Promise<Pick<PersonRow, 'id' | 'name'>> {
    const me = await this.directory.findByEmail(user.email);
    if (!forPerson || forPerson === me?.id) {
      if (!me) throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
      return me;
    }
    if (currentRole() !== 'admin') throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    return this.directory.requireActive(forPerson);
  }

  private async find(id: string): Promise<TrainingRow> {
    const row = await this.trainings.findById(id);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return row;
  }

  private async requireInUse(id: string): Promise<TrainingRow> {
    const row = await this.find(id);
    if (row.archivedAt) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    return row;
  }

  /** Two trainings with one name could not be told apart in a list or a log. */
  private async requireFreeName(name: string, exceptId?: string): Promise<void> {
    if (await this.trainings.findByName(name, exceptId)) {
      throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    }
  }

  private record(
    actor: ActivityActor,
    action: ActivityAction,
    row: TrainingRow,
    person?: string,
  ): Promise<void> {
    return this.activity.record({
      actor,
      action,
      subject: { type: 'training', id: row.id },
      details: { name: row.name, ...(person ? { person } : {}) },
    });
  }
}
