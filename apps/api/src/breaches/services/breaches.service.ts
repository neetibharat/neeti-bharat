import { HttpStatus, Injectable } from '@nestjs/common';
import {
  nextBreachStep,
  type BreachListResponse,
  type BreachResponse,
  type BreachStep,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { PersonDirectory } from '../../people/services/person-directory';
import { ProfileService } from '../../profile/services/profile.service';
import type {
  CompleteStepInput,
  CreateBreachInput,
  ListBreachesQuery,
  UpdateBreachInput,
} from '../dto/breach.dto';
import { BreachRepository } from '../repositories/breach.repository';
import { reportWindowOf } from '../utils/breach-clock';
import { detailsChanged } from '../utils/breach-change';
import { breachList } from '../utils/breach-list';
import { toBreachResponse, type BreachRow, type Clock } from '../utils/breach-view';

/** A found time this far ahead of the server still counts as now, so a slow clock does not refuse a report. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class BreachesService {
  constructor(
    private readonly breaches: BreachRepository,
    private readonly profile: ProfileService,
    private readonly directory: PersonDirectory,
    private readonly activity: ActivityService,
  ) {}

  async list(query: ListBreachesQuery): Promise<BreachListResponse> {
    const [matching, all, clock] = await Promise.all([
      this.breaches.findForList(query.q),
      this.breaches.findAllForCounts(),
      this.clock(),
    ]);
    return breachList(matching, all, query, clock);
  }

  async get(id: string): Promise<BreachResponse> {
    return toBreachResponse(await this.find(id), await this.clock());
  }

  async create(input: CreateBreachInput, actor: ActivityActor): Promise<BreachResponse> {
    const clock = await this.clock();
    const foundAt = input.foundAt ?? clock.now;
    assertNotInFuture(foundAt, clock.now);
    const assignee = await this.assignee(input.assigneeId);

    const row = await this.breaches.create(
      {
        title: input.title,
        description: input.description,
        foundAt,
        affectedSystems: input.affectedSystems,
        affectedData: input.affectedData,
        peopleAffected: input.peopleAffected ?? null,
        assigneeId: assignee?.id ?? null,
      },
      { step: 'found', completedAt: foundAt, completedByName: actor.label },
      actor.label,
    );
    await this.activity.record({
      actor,
      action: 'BREACH_REPORTED',
      subject: { type: 'breach', id: row.id },
      details: { title: row.title },
    });
    if (assignee) await this.recordAssigned(actor, row, '', assignee.name);
    return toBreachResponse(row, clock);
  }

  async update(
    id: string,
    input: UpdateBreachInput,
    actor: ActivityActor,
  ): Promise<BreachResponse> {
    const current = await this.find(id);
    if (isClosed(current)) throw new AppException('BREACH_CLOSED', HttpStatus.CONFLICT);
    const clock = await this.clock();
    assertNotInFuture(input.foundAt, clock.now);
    await this.assignee(input.assigneeId);

    const row = await this.breaches.update(id, input);
    await this.recordChanges(actor, current, row, detailsChanged(current, input));
    return toBreachResponse(row, clock);
  }

  /** Marks the next step done. Steps go in order, so any other step is refused. */
  async completeStep(
    id: string,
    step: BreachStep,
    input: CompleteStepInput,
    actor: ActivityActor,
  ): Promise<BreachResponse> {
    const current = await this.find(id);
    if (nextBreachStep(current.steps.map((entry) => entry.step)) !== step) {
      throw new AppException('STEP_ORDER', HttpStatus.CONFLICT);
    }
    const clock = await this.clock();
    await this.breaches.addStep(id, {
      step,
      completedAt: clock.now,
      completedByName: actor.label,
      note: input.note,
    });
    await this.activity.record({
      actor,
      action: step === 'close' ? 'BREACH_CLOSED' : 'BREACH_STEP_COMPLETED',
      subject: { type: 'breach', id },
      details: { title: current.title, step },
    });
    return toBreachResponse(await this.find(id), clock);
  }

  /** Whoever is named must still work here. Nobody means the DPO deals with it. */
  private async assignee(id: string | null | undefined) {
    return id ? this.directory.requireActive(id) : null;
  }

  /** An edit is logged when a detail changed, and an assignment when the assignee did. A save that changes nothing logs nothing. */
  private async recordChanges(
    actor: ActivityActor,
    before: BreachRow,
    after: BreachRow,
    edited: boolean,
  ): Promise<void> {
    if (edited) await this.recordEdited(actor, after);
    if (before.assignee?.id === after.assignee?.id) return;
    await this.recordAssigned(actor, after, nameOf(before.assignee), nameOf(after.assignee));
  }

  private recordEdited(actor: ActivityActor, row: BreachRow): Promise<void> {
    return this.activity.record({
      actor,
      action: 'BREACH_EDITED',
      subject: { type: 'breach', id: row.id },
      details: { title: row.title },
    });
  }

  private recordAssigned(
    actor: ActivityActor,
    row: Pick<BreachRow, 'id' | 'title'>,
    before: string,
    after: string,
  ): Promise<void> {
    return this.activity.record({
      actor,
      action: 'BREACH_ASSIGNED',
      subject: { type: 'breach', id: row.id },
      details: { title: row.title },
      before: { value: before },
      after: { value: after },
    });
  }

  private async find(id: string): Promise<BreachRow> {
    const row = await this.breaches.findOne(id);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return row;
  }

  private async clock(): Promise<Clock> {
    const { entries } = await this.profile.list();
    return { windowMs: reportWindowOf(entries), now: new Date() };
  }
}

const nameOf = (person: { name: string } | null): string => person?.name ?? '';

const isClosed = (row: BreachRow): boolean => row.steps.some((entry) => entry.step === 'close');

function assertNotInFuture(foundAt: Date, now: Date): void {
  if (foundAt.getTime() > now.getTime() + CLOCK_SKEW_MS) {
    throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
  }
}
