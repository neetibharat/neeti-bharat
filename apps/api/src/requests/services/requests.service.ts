import { HttpStatus, Injectable } from '@nestjs/common';
import {
  REQUEST_DUE_SOON_DAYS,
  isReadyToClose,
  type RequestAttentionResponse,
  type RequestBoardResponse,
  type RequestListResponse,
  type RequestResponse,
} from '@dpdp-kit/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { PersonDirectory } from '../../people/services/person-directory';
import { ProfileService } from '../../profile/services/profile.service';
import type {
  AddTaskInput,
  BoardRequestsQuery,
  CloseRequestInput,
  CreateRequestInput,
  ListRequestsQuery,
  UpdateRequestInput,
  UpdateTaskInput,
  VerifyIdentityInput,
} from '../dto/request.dto';
import { RequestRepository } from '../repositories/request.repository';
import { detailsChanged } from '../utils/request-change';
import { dueAtOf, replyWindowOf } from '../utils/request-due';
import { requestBoard } from '../utils/request-board';
import { requestCounts, requestListPage } from '../utils/request-list';
import { toListItem, toRequestResponse, type RequestRow } from '../utils/request-view';

/** A received time this far ahead of the server still counts as now, so a slow clock does not refuse a request. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** How many requests the Dashboard lists. */
const ATTENTION_LIMIT = 5;

type RequestAction =
  | 'REQUEST_RECEIVED'
  | 'REQUEST_EDITED'
  | 'REQUEST_ASSIGNED'
  | 'REQUEST_IDENTITY_VERIFIED'
  | 'REQUEST_TASK_ADDED'
  | 'REQUEST_TASK_UPDATED'
  | 'REQUEST_TASK_REMOVED'
  | 'REQUEST_CLOSED';

const nameOf = (person: { name: string } | null): string => person?.name ?? '';

const conflict = (code: 'REQUEST_CLOSED' | 'REQUEST_NOT_READY' | 'IDENTITY_NOT_VERIFIED') =>
  new AppException(code, HttpStatus.CONFLICT);

@Injectable()
export class RequestsService {
  constructor(
    private readonly requests: RequestRepository,
    private readonly profile: ProfileService,
    private readonly directory: PersonDirectory,
    private readonly activity: ActivityService,
  ) {}

  async list(query: ListRequestsQuery): Promise<RequestListResponse> {
    const now = new Date();
    const [rows, total, byStatus, overdue] = await Promise.all([
      this.requests.findPage(query),
      this.requests.count(query),
      this.requests.countByStatus(),
      this.requests.countOverdue(now),
    ]);
    return requestListPage(rows, total, query, requestCounts(byStatus, overdue), now);
  }

  /** The first cards of each column and the head counts, so the board needs one call. */
  async board(query: BoardRequestsQuery): Promise<RequestBoardResponse> {
    const now = new Date();
    const [fresh, inProgress, done, byStatus, overdue] = await Promise.all([
      this.requests.findColumn('new', query),
      this.requests.findColumn('in_progress', query),
      this.requests.findColumn('done', query),
      this.requests.countByStatus(),
      this.requests.countOverdue(now),
    ]);
    const columns = { new: fresh, in_progress: inProgress, done };
    return requestBoard(columns, requestCounts(byStatus, overdue), now);
  }

  /** Open requests that are late or due within a week, the nearest first, for the Dashboard. */
  async attention(): Promise<RequestAttentionResponse> {
    const now = new Date();
    const soon = new Date(now.getTime() + REQUEST_DUE_SOON_DAYS * DAY_MS);
    const [rows, total] = await Promise.all([
      this.requests.findDueBy(soon, ATTENTION_LIMIT),
      this.requests.countDueBy(soon),
    ]);
    return { items: rows.map((row) => toListItem(row, now)), total };
  }

  async get(id: string): Promise<RequestResponse> {
    return toRequestResponse(await this.find(id), new Date());
  }

  async create(input: CreateRequestInput, actor: ActivityActor): Promise<RequestResponse> {
    const now = new Date();
    const receivedAt = input.receivedAt ?? now;
    if (receivedAt.getTime() > now.getTime() + CLOCK_SKEW_MS) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    }
    const { entries } = await this.profile.list();
    const assignee = await this.assignee(input.assigneeId);

    const row = await this.requests.create({
      type: input.type,
      source: input.source,
      personName: input.personName,
      personEmail: input.personEmail,
      details: input.details,
      receivedAt,
      dueAt: dueAtOf(receivedAt, replyWindowOf(entries)),
      loggedByName: actor.label,
      assigneeId: assignee?.id ?? null,
    });
    await this.record(actor, 'REQUEST_RECEIVED', row);
    if (assignee) await this.recordAssigned(actor, row, '', assignee.name);
    return toRequestResponse(row, now);
  }

  async update(
    id: string,
    input: UpdateRequestInput,
    actor: ActivityActor,
  ): Promise<RequestResponse> {
    const current = await this.find(id);
    this.assertOpen(current);
    await this.assignee(input.assigneeId);
    await this.requests.update(id, input);

    const row = await this.find(id);
    await this.recordChanges(actor, current, row, detailsChanged(current, input));
    return toRequestResponse(row, new Date());
  }

  async verifyIdentity(
    id: string,
    input: VerifyIdentityInput,
    actor: ActivityActor,
  ): Promise<RequestResponse> {
    const current = await this.find(id);
    this.assertOpen(current);
    if (current.identityVerifiedAt) throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    await this.requests.markIdentityVerified(id, {
      at: new Date(),
      byName: actor.label,
      note: input.note,
    });
    return this.changed(id, 'REQUEST_IDENTITY_VERIFIED', actor);
  }

  async addTask(id: string, input: AddTaskInput, actor: ActivityActor): Promise<RequestResponse> {
    this.assertOpen(await this.find(id));
    await this.requests.addTask(id, input.system);
    return this.changed(id, 'REQUEST_TASK_ADDED', actor);
  }

  /** Nothing is shared or erased before the identity is checked, so a task keeps "to do" until then. */
  async updateTask(
    id: string,
    taskId: string,
    input: UpdateTaskInput,
    actor: ActivityActor,
  ): Promise<RequestResponse> {
    const current = await this.find(id);
    this.assertOpen(current);
    this.taskOf(current, taskId);
    if (!current.identityVerifiedAt) throw conflict('IDENTITY_NOT_VERIFIED');
    if (input.outcome === 'kept_by_law' && !input.reason) {
      throw new AppException('VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
    }
    const reason = input.outcome === 'kept_by_law' ? (input.reason ?? null) : null;
    await this.requests.updateTask(taskId, { outcome: input.outcome, reason });
    return this.changed(id, 'REQUEST_TASK_UPDATED', actor);
  }

  async removeTask(id: string, taskId: string, actor: ActivityActor): Promise<RequestResponse> {
    const current = await this.find(id);
    this.assertOpen(current);
    if (this.taskOf(current, taskId).outcome !== 'todo') {
      throw new AppException('CONFLICT', HttpStatus.CONFLICT);
    }
    await this.requests.removeTask(taskId);
    return this.changed(id, 'REQUEST_TASK_REMOVED', actor);
  }

  /** Closing needs the identity checked, no task still to do and the reply written. */
  async close(
    id: string,
    input: CloseRequestInput,
    actor: ActivityActor,
  ): Promise<RequestResponse> {
    const current = await this.find(id);
    this.assertOpen(current);
    const ready = isReadyToClose({
      identityVerified: current.identityVerifiedAt !== null,
      tasks: current.tasks,
    });
    if (!ready || !input.replyNote) throw conflict('REQUEST_NOT_READY');
    await this.requests.close(id, {
      at: new Date(),
      byName: actor.label,
      replyNote: input.replyNote,
    });
    return this.changed(id, 'REQUEST_CLOSED', actor);
  }

  /** Whoever is named must still work here. Nobody means the DPO deals with it. */
  private async assignee(id: string | null | undefined) {
    return id ? this.directory.requireActive(id) : null;
  }

  private async find(id: string): Promise<RequestRow> {
    const row = await this.requests.findOne(id);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return row;
  }

  private assertOpen(row: RequestRow): void {
    if (row.status === 'done') throw conflict('REQUEST_CLOSED');
  }

  private taskOf(row: RequestRow, taskId: string): RequestRow['tasks'][number] {
    const task = row.tasks.find((candidate) => candidate.id === taskId);
    if (!task) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    return task;
  }

  /** Writes the activity entry for a change and answers with the request as it now stands. */
  private async changed(
    id: string,
    action: RequestAction,
    actor: ActivityActor,
  ): Promise<RequestResponse> {
    const row = await this.find(id);
    await this.record(actor, action, row);
    return toRequestResponse(row, new Date());
  }

  /** An edit is logged when a detail changed, and an assignment when the assignee did. A save that changes nothing logs nothing. */
  private async recordChanges(
    actor: ActivityActor,
    before: RequestRow,
    after: RequestRow,
    edited: boolean,
  ): Promise<void> {
    if (edited) await this.record(actor, 'REQUEST_EDITED', after);
    if (before.assignee?.id === after.assignee?.id) return;
    await this.recordAssigned(actor, after, nameOf(before.assignee), nameOf(after.assignee));
  }

  /** The names go in the log, as for a control, so the sentence reads without a lookup. */
  private recordAssigned(
    actor: ActivityActor,
    row: Pick<RequestRow, 'id' | 'type' | 'personName'>,
    before: string,
    after: string,
  ): Promise<void> {
    return this.activity.record({
      actor,
      action: 'REQUEST_ASSIGNED',
      subject: { type: 'request', id: row.id },
      details: { type: row.type, name: row.personName },
      before: { value: before },
      after: { value: after },
    });
  }

  /** Only the type and the person's name go in the log: never the details or the email. */
  private record(
    actor: ActivityActor,
    action: RequestAction,
    row: Pick<RequestRow, 'id' | 'type' | 'personName'>,
  ): Promise<void> {
    return this.activity.record({
      actor,
      action,
      subject: { type: 'request', id: row.id },
      details: { type: row.type, name: row.personName },
    });
  }
}
