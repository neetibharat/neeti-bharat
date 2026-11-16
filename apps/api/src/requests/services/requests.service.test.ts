import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import type { PersonDirectory } from '../../people/services/person-directory';
import type { ProfileService } from '../../profile/services/profile.service';
import type {
  NewRequest,
  RequestDetails,
  RequestRepository,
} from '../repositories/request.repository';
import type { RequestRow } from '../utils/request-view';
import { RequestsService } from './requests.service';

const actor = { id: 'u1', label: 'Asha' };
const DAY = 86_400_000;

const input = {
  type: 'access' as const,
  source: 'manual' as const,
  personName: 'Ravi Kumar',
  personEmail: 'ravi@example.com',
  details: 'Please send me a copy of everything you hold on me.',
  assigneeId: null as string | null,
};

const people = new Map([
  ['p1', 'Meera Shah'],
  ['p2', 'Dev Anand'],
]);
const assigneeOf = (id: string | null) =>
  id && people.has(id) ? { id, name: people.get(id)! } : null;

/** An in-memory stand-in for the repository, so the rules can be tried without a database. */
function build(replyTime = '90 days') {
  const rows = new Map<string, RequestRow>();
  let taskCount = 0;
  const repository = {
    findOne: vi.fn(async (id: string) => rows.get(id) ?? null),
    create: vi.fn(async (data: NewRequest) => {
      const row: RequestRow = {
        id: `r${rows.size + 1}`,
        number: rows.size + 1,
        ...data,
        assignee: assigneeOf(data.assigneeId),
        status: 'new',
        identityVerifiedAt: null,
        identityVerifiedByName: null,
        identityNote: null,
        replyNote: null,
        closedAt: null,
        closedByName: null,
        tasks: [],
      };
      rows.set(row.id, row);
      return row;
    }),
    findColumn: vi.fn(async (status: string, query: { limit: number }) =>
      [...rows.values()].filter((row) => row.status === status).slice(0, query.limit),
    ),
    countByStatus: vi.fn(async () =>
      (['new', 'in_progress', 'done'] as const).map((status) => ({
        status,
        count: [...rows.values()].filter((row) => row.status === status).length,
      })),
    ),
    countOverdue: vi.fn(
      async (now: Date) =>
        [...rows.values()].filter((row) => row.status !== 'done' && row.dueAt < now).length,
    ),
    update: vi.fn(async (id: string, data: RequestDetails) => {
      rows.set(id, { ...rows.get(id)!, ...data, assignee: assigneeOf(data.assigneeId) });
    }),
    markIdentityVerified: vi.fn(
      async (id: string, data: { at: Date; byName: string; note?: string }) => {
        rows.set(id, {
          ...rows.get(id)!,
          status: 'in_progress',
          identityVerifiedAt: data.at,
          identityVerifiedByName: data.byName,
          identityNote: data.note ?? null,
        });
      },
    ),
    addTask: vi.fn(async (id: string, system: string) => {
      const row = rows.get(id)!;
      row.tasks.push({ id: `t${++taskCount}`, system, outcome: 'todo', reason: null });
    }),
    updateTask: vi.fn(async (taskId: string, data: { outcome: 'todo'; reason: string | null }) => {
      for (const row of rows.values()) {
        row.tasks = row.tasks.map((task) => (task.id === taskId ? { ...task, ...data } : task));
      }
    }),
    removeTask: vi.fn(async (taskId: string) => {
      for (const row of rows.values()) row.tasks = row.tasks.filter((task) => task.id !== taskId);
    }),
    close: vi.fn(async (id: string, data: { at: Date; byName: string; replyNote: string }) => {
      rows.set(id, {
        ...rows.get(id)!,
        status: 'done',
        closedAt: data.at,
        closedByName: data.byName,
        replyNote: data.replyNote,
      });
    }),
  } as unknown as RequestRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const profile = {
    list: vi.fn().mockResolvedValue({ entries: [{ key: 'grievanceReplyTime', value: replyTime }] }),
  } as unknown as ProfileService;
  const directory = {
    requireActive: vi.fn(async (id: string) => {
      const person = assigneeOf(id);
      if (!person) throw new AppException('VALIDATION_FAILED', 400);
      return person;
    }),
  } as unknown as PersonDirectory;
  return {
    service: new RequestsService(repository, profile, directory, activity),
    repository,
    activity,
  };
}

const failsWith = async (work: Promise<unknown>, code: string, status: number) => {
  const error = await work.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppException);
  expect(error).toMatchObject({ code });
  expect((error as AppException).getStatus()).toBe(status);
};

/** A request with one task, identity checked or not. */
async function started(verified: boolean) {
  const context = build();
  const request = await context.service.create(input, actor);
  const withTask = await context.service.addTask(request.id, { system: 'Billing' }, actor);
  if (verified) await context.service.verifyIdentity(request.id, {}, actor);
  return { ...context, id: request.id, taskId: withTask.tasks[0]!.id };
}

describe('RequestsService.create', () => {
  it('starts as new, sets the due date from the reply time and records who logged it', async () => {
    const { service, activity } = build('30 days');
    const receivedAt = new Date(Date.now() - 2 * DAY);
    const request = await service.create({ ...input, receivedAt }, actor);
    expect(request).toMatchObject({
      status: 'new',
      loggedByName: 'Asha',
      overdue: false,
      identityVerifiedAt: null,
      tasks: [],
    });
    expect(request.dueAt).toBe(new Date(receivedAt.getTime() + 30 * DAY).toISOString());
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REQUEST_RECEIVED',
        subject: { type: 'request', id: request.id },
        details: { type: 'access', name: 'Ravi Kumar' },
      }),
    );
  });

  it('falls back to 90 days when the profile answer cannot be read', async () => {
    const receivedAt = new Date(Date.now() - DAY);
    const request = await build('whenever').service.create({ ...input, receivedAt }, actor);
    expect(request.dueAt).toBe(new Date(receivedAt.getTime() + 90 * DAY).toISOString());
  });

  it('flags a request received longer ago than the reply time as overdue', async () => {
    const receivedAt = new Date(Date.now() - 100 * DAY);
    const request = await build().service.create({ ...input, receivedAt }, actor);
    expect(request.overdue).toBe(true);
  });

  it('refuses a time received in the future', async () => {
    const receivedAt = new Date(Date.now() + 2 * DAY);
    await failsWith(
      build().service.create({ ...input, receivedAt }, actor),
      'VALIDATION_FAILED',
      400,
    );
  });
});

describe('RequestsService identity check', () => {
  it('moves a new request to in progress and records who and when', async () => {
    const { service, activity, id } = await started(false);
    const request = await service.verifyIdentity(id, { note: 'Checked the passport' }, actor);
    expect(request).toMatchObject({
      status: 'in_progress',
      identityVerifiedByName: 'Asha',
      identityNote: 'Checked the passport',
    });
    expect(request.identityVerifiedAt).not.toBeNull();
    expect(activity.record).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'REQUEST_IDENTITY_VERIFIED' }),
    );
  });

  it('is refused a second time', async () => {
    const { service, id } = await started(true);
    await failsWith(service.verifyIdentity(id, {}, actor), 'CONFLICT', 409);
  });

  it('does not let a task change outcome before the identity is checked', async () => {
    const { service, id, taskId } = await started(false);
    await failsWith(
      service.updateTask(id, taskId, { outcome: 'done' }, actor),
      'IDENTITY_NOT_VERIFIED',
      409,
    );
  });
});

describe('RequestsService tasks', () => {
  it('can be added before the identity is checked, and start as to do', async () => {
    const { service, id } = await started(false);
    const request = await service.get(id);
    expect(request.tasks).toEqual([
      expect.objectContaining({ system: 'Billing', outcome: 'todo' }),
    ]);
  });

  it('takes an outcome once the identity is checked', async () => {
    const { service, id, taskId } = await started(true);
    const request = await service.updateTask(id, taskId, { outcome: 'erased' }, actor);
    expect(request.tasks[0]).toMatchObject({ outcome: 'erased', reason: null });
  });

  it('needs a reason to keep data by law, and keeps it only for that outcome', async () => {
    const { service, id, taskId } = await started(true);
    await failsWith(
      service.updateTask(id, taskId, { outcome: 'kept_by_law' }, actor),
      'VALIDATION_FAILED',
      400,
    );
    const kept = await service.updateTask(
      id,
      taskId,
      { outcome: 'kept_by_law', reason: 'Tax records: 8 years' },
      actor,
    );
    expect(kept.tasks[0]).toMatchObject({ outcome: 'kept_by_law', reason: 'Tax records: 8 years' });
    const erased = await service.updateTask(id, taskId, { outcome: 'erased', reason: 'x' }, actor);
    expect(erased.tasks[0]!.reason).toBeNull();
  });

  it('is 404 for a task that is not on the request', async () => {
    const { service, id } = await started(true);
    await failsWith(service.updateTask(id, 'nope', { outcome: 'done' }, actor), 'NOT_FOUND', 404);
    await failsWith(service.removeTask(id, 'nope', actor), 'NOT_FOUND', 404);
  });

  it('can be removed only while still to do', async () => {
    const { service, id, taskId } = await started(true);
    await service.updateTask(id, taskId, { outcome: 'done' }, actor);
    await failsWith(service.removeTask(id, taskId, actor), 'CONFLICT', 409);
    await service.updateTask(id, taskId, { outcome: 'todo' }, actor);
    expect((await service.removeTask(id, taskId, actor)).tasks).toEqual([]);
  });
});

describe('RequestsService.close', () => {
  it('is refused until the identity is checked', async () => {
    const { service, id } = await started(false);
    await failsWith(service.close(id, { replyNote: 'Done.' }, actor), 'REQUEST_NOT_READY', 409);
  });

  it('is refused while a task is still to do', async () => {
    const { service, id } = await started(true);
    await failsWith(service.close(id, { replyNote: 'Done.' }, actor), 'REQUEST_NOT_READY', 409);
  });

  it('is refused without a reply', async () => {
    const { service, id, taskId } = await started(true);
    await service.updateTask(id, taskId, { outcome: 'done' }, actor);
    await failsWith(service.close(id, { replyNote: '' }, actor), 'REQUEST_NOT_READY', 409);
  });

  it('closes a request with no tasks once the identity is checked and the reply is written', async () => {
    const { service, activity } = build();
    const { id } = await service.create(input, actor);
    await service.verifyIdentity(id, {}, actor);
    const closed = await service.close(id, { replyNote: 'Here is your copy.' }, actor);
    expect(closed).toMatchObject({
      status: 'done',
      replyNote: 'Here is your copy.',
      closedByName: 'Asha',
      overdue: false,
    });
    expect(closed.closedAt).not.toBeNull();
    expect(activity.record).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'REQUEST_CLOSED' }),
    );
  });
});

describe('a closed request', () => {
  async function closed() {
    const context = await started(true);
    await context.service.updateTask(context.id, context.taskId, { outcome: 'done' }, actor);
    await context.service.close(context.id, { replyNote: 'Done.' }, actor);
    return context;
  }

  it('cannot be edited, checked again, closed again or have its tasks changed', async () => {
    const { service, id, taskId } = await closed();
    const refused = [
      service.update(id, input, actor),
      service.verifyIdentity(id, {}, actor),
      service.addTask(id, { system: 'CRM' }, actor),
      service.updateTask(id, taskId, { outcome: 'erased' }, actor),
      service.removeTask(id, taskId, actor),
      service.close(id, { replyNote: 'Again.' }, actor),
    ];
    for (const work of refused) await failsWith(work, 'REQUEST_CLOSED', 409);
  });
});

describe('RequestsService.update and activity', () => {
  it('changes the details of an open request', async () => {
    const { service, id } = await started(false);
    const request = await service.update(
      id,
      { ...input, personName: 'Ravi K', type: 'erasure' },
      actor,
    );
    expect(request).toMatchObject({ personName: 'Ravi K', type: 'erasure' });
  });

  it('records only the type and the name, never the details or the email', async () => {
    const { service, activity, id, taskId } = await started(true);
    await service.update(id, { ...input, details: 'Rewritten wording.' }, actor);
    await service.updateTask(id, taskId, { outcome: 'done' }, actor);
    const calls = vi.mocked(activity.record).mock.calls.map(([event]) => event);
    expect(calls.map((event) => event.action)).toEqual([
      'REQUEST_RECEIVED',
      'REQUEST_TASK_ADDED',
      'REQUEST_IDENTITY_VERIFIED',
      'REQUEST_EDITED',
      'REQUEST_TASK_UPDATED',
    ]);
    for (const event of calls) {
      expect(event.details).toEqual({ type: 'access', name: 'Ravi Kumar' });
      expect(JSON.stringify(event)).not.toContain(input.personEmail);
      expect(JSON.stringify(event)).not.toContain(input.details);
    }
  });

  it('is 404 for an unknown request', async () => {
    const { service } = build();
    await failsWith(service.get('nope'), 'NOT_FOUND', 404);
    await failsWith(service.update('nope', input, actor), 'NOT_FOUND', 404);
    await failsWith(service.close('nope', { replyNote: 'x' }, actor), 'NOT_FOUND', 404);
  });
});

describe('RequestsService assignee', () => {
  const assignedCalls = (activity: ActivityService) =>
    vi
      .mocked(activity.record)
      .mock.calls.map(([call]) => call)
      .filter((call) => call.action === 'REQUEST_ASSIGNED');

  it('is nobody by default and records no assignment', async () => {
    const { service, activity } = build();
    const request = await service.create(input, actor);
    expect(request.assignee).toBeNull();
    expect(assignedCalls(activity)).toEqual([]);
  });

  it('can be set when logging; the assignment is recorded after the request, with names only', async () => {
    const { service, activity } = build();
    const request = await service.create({ ...input, assigneeId: 'p1' }, actor);
    expect(request.assignee).toEqual({ id: 'p1', name: 'Meera Shah' });
    const calls = vi.mocked(activity.record).mock.calls.map(([call]) => call);
    expect(calls.map((call) => call.action)).toEqual(['REQUEST_RECEIVED', 'REQUEST_ASSIGNED']);
    expect(calls[1]).toMatchObject({
      details: { type: 'access', name: 'Ravi Kumar' },
      before: { value: '' },
      after: { value: 'Meera Shah' },
    });
    expect(JSON.stringify(calls[1])).not.toContain(input.personEmail);
  });

  it('refuses someone who has left or does not exist', async () => {
    const { service, repository } = build();
    await failsWith(
      service.create({ ...input, assigneeId: 'gone' }, actor),
      'VALIDATION_FAILED',
      400,
    );
    expect(repository.create).not.toHaveBeenCalled();
    const { id } = await service.create(input, actor);
    await failsWith(
      service.update(id, { ...input, assigneeId: 'gone' }, actor),
      'VALIDATION_FAILED',
      400,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('records a change once with before and after names, and only that when nothing else changed', async () => {
    const { service, activity } = build();
    const { id } = await service.create({ ...input, assigneeId: 'p1' }, actor);
    vi.mocked(activity.record).mockClear();

    await service.update(id, { ...input, assigneeId: 'p2' }, actor);
    expect(activity.record).toHaveBeenCalledTimes(1);
    expect(assignedCalls(activity)[0]).toMatchObject({
      before: { value: 'Meera Shah' },
      after: { value: 'Dev Anand' },
    });

    vi.mocked(activity.record).mockClear();
    const cleared = await service.update(id, { ...input, assigneeId: null }, actor);
    expect(cleared.assignee).toBeNull();
    expect(assignedCalls(activity)[0]).toMatchObject({
      before: { value: 'Dev Anand' },
      after: { value: '' },
    });
  });

  it('records nothing when nothing changes', async () => {
    const { service, activity } = build();
    const { id } = await service.create({ ...input, assigneeId: 'p1' }, actor);
    vi.mocked(activity.record).mockClear();
    await service.update(id, { ...input, assigneeId: 'p1' }, actor);
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('records the edit and the assignment when both change', async () => {
    const { service, activity } = build();
    const { id } = await service.create(input, actor);
    vi.mocked(activity.record).mockClear();
    await service.update(id, { ...input, personName: 'Ravi K', assigneeId: 'p1' }, actor);
    const actions = vi.mocked(activity.record).mock.calls.map(([call]) => call.action);
    expect(actions).toEqual(['REQUEST_EDITED', 'REQUEST_ASSIGNED']);
  });

  it('cannot be changed once the request is done', async () => {
    const { service, id, taskId } = await started(true);
    await service.updateTask(id, taskId, { outcome: 'done' }, actor);
    await service.close(id, { replyNote: 'Done.' }, actor);
    await failsWith(
      service.update(id, { ...input, assigneeId: 'p1' }, actor),
      'REQUEST_CLOSED',
      409,
    );
  });

  it('shows the name on the board cards', async () => {
    const { service } = build();
    await service.create({ ...input, assigneeId: 'p2' }, actor);
    await service.create(input, actor);
    const board = await service.board({ limit: 10 });
    expect(board.new.map((card) => card.assigneeName)).toEqual(['Dev Anand', null]);
    expect(board.new[0]).not.toHaveProperty('assigneeId');
  });
});

describe('RequestsService.board', () => {
  it('caps each column at the limit while the counts cover every request', async () => {
    const { service } = build();
    for (let n = 0; n < 3; n++) await service.create(input, actor);
    const board = await service.board({ limit: 2 });
    expect(board.new).toHaveLength(2);
    expect(board.in_progress).toEqual([]);
    expect(board.counts).toEqual({ new: 3, in_progress: 0, done: 0, overdue: 0 });
  });

  it('sends only what a card shows, with the REQ number', async () => {
    const { service } = build();
    const created = await service.create(input, actor);
    const [card] = (await service.board({ limit: 10 })).new;
    expect(card).toEqual({
      id: created.id,
      number: 1,
      type: 'access',
      personName: 'Ravi Kumar',
      status: 'new',
      dueAt: created.dueAt,
      overdue: false,
      closedAt: null,
      closedOnTime: null,
      assigneeName: null,
    });
  });

  it('puts a closed request in done, closed on time, and counts a late open one as overdue', async () => {
    const { service } = build();
    const receivedAt = new Date(Date.now() - 100 * DAY);
    const late = await service.create({ ...input, receivedAt }, actor);
    const closed = await service.create(input, actor);
    await service.verifyIdentity(closed.id, {}, actor);
    await service.close(closed.id, { replyNote: 'Sent' }, actor);
    const board = await service.board({ limit: 10 });
    expect(board.done.map((card) => [card.id, card.closedOnTime])).toEqual([[closed.id, true]]);
    expect(board.new[0]).toMatchObject({ id: late.id, overdue: true });
    expect(board.counts).toEqual({ new: 1, in_progress: 0, done: 1, overdue: 1 });
  });
});
