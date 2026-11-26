import { BREACH_STEPS, type BreachStep } from '@neeti-bharat/shared';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityService } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import type { PersonDirectory } from '../../people/services/person-directory';
import type { ProfileService } from '../../profile/services/profile.service';
import type { BreachDetails, BreachRepository, NewStep } from '../repositories/breach.repository';
import type { BreachRow } from '../utils/breach-view';
import { BreachesService } from './breaches.service';

const actor = { id: 'u1', label: 'Asha' };
const HOUR = 3_600_000;

const details = {
  title: 'Export sent to the wrong address',
  description: 'A customer file went to a stranger.',
  affectedSystems: 'Billing',
  affectedData: 'Names and emails',
};

const people = new Map([
  ['p1', 'Ravi Kumar'],
  ['p2', 'Meera Shah'],
]);
const assigneeOf = (id: string | null) =>
  id && people.has(id) ? { id, name: people.get(id)! } : null;

/** An in-memory stand-in for the repository, so the rules can be tried without a database. */
function build(window = '72 hours') {
  const rows = new Map<string, BreachRow>();
  const repository = {
    findForList: vi.fn(async () => [...rows.values()]),
    findAllForCounts: vi.fn(async () => [...rows.values()]),
    findOne: vi.fn(async (id: string) => rows.get(id) ?? null),
    create: vi.fn(async (data: BreachDetails, found: NewStep, reportedByName: string) => {
      const row: BreachRow = {
        id: `b${rows.size + 1}`,
        ...data,
        assignee: assigneeOf(data.assigneeId),
        reportedByName,
        steps: [{ ...found, note: found.note ?? null }],
      };
      rows.set(row.id, row);
      return row;
    }),
    update: vi.fn(async (id: string, data: BreachDetails) => {
      const row = { ...rows.get(id)!, ...data, assignee: assigneeOf(data.assigneeId) };
      rows.set(id, row);
      return row;
    }),
    addStep: vi.fn(async (id: string, step: NewStep) => {
      rows.get(id)!.steps.push({ ...step, note: step.note ?? null });
    }),
  } as unknown as BreachRepository;
  const activity = { record: vi.fn().mockResolvedValue(undefined) } as unknown as ActivityService;
  const profile = {
    list: vi.fn().mockResolvedValue({ entries: [{ key: 'breachReportWindow', value: window }] }),
  } as unknown as ProfileService;
  const directory = {
    requireActive: vi.fn(async (id: string) => {
      const person = assigneeOf(id);
      if (!person) throw new AppException('VALIDATION_FAILED', 400);
      return person;
    }),
  } as unknown as PersonDirectory;
  return {
    service: new BreachesService(repository, profile, directory, activity),
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

async function reportOne(service: BreachesService, foundAt?: Date) {
  return service.create({ ...details, foundAt, peopleAffected: 120 }, actor);
}

describe('BreachesService.create', () => {
  it('starts at the found step, done at the time found, and records who reported it', async () => {
    const { service, activity } = build();
    const foundAt = new Date(Date.now() - 2 * HOUR);
    const breach = await reportOne(service, foundAt);
    expect(breach).toMatchObject({
      title: details.title,
      reportedByName: 'Asha',
      currentStep: 'assess',
      closedAt: null,
      overdue: false,
      peopleAffected: 120,
    });
    expect(breach.steps.map((s) => s.completed)).toEqual([true, false, false, false, false]);
    expect(breach.steps[0]).toMatchObject({
      completedAt: foundAt.toISOString(),
      completedByName: 'Asha',
    });
    expect(activity.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BREACH_REPORTED',
        subject: { type: 'breach', id: breach.id },
        details: { title: details.title },
      }),
    );
  });

  it('works out the Board deadline from the report window in the company profile', async () => {
    const foundAt = new Date(Date.now() - HOUR);
    const breach = await reportOne(build('48 hours').service, foundAt);
    expect(breach.reportDueAt).toBe(new Date(foundAt.getTime() + 48 * HOUR).toISOString());
  });

  it('falls back to 72 hours when the profile answer cannot be read', async () => {
    const foundAt = new Date(Date.now() - HOUR);
    const breach = await reportOne(build('whenever').service, foundAt);
    expect(breach.reportDueAt).toBe(new Date(foundAt.getTime() + 72 * HOUR).toISOString());
  });

  it('flags a breach found longer ago than the window as overdue', async () => {
    const breach = await reportOne(build().service, new Date(Date.now() - 80 * HOUR));
    expect(breach.overdue).toBe(true);
  });

  it('refuses a time found in the future', async () => {
    const { service } = build();
    await failsWith(reportOne(service, new Date(Date.now() + 2 * HOUR)), 'VALIDATION_FAILED', 400);
  });
});

describe('BreachesService.completeStep', () => {
  it('moves through the steps in order and closes at the end', async () => {
    const { service, activity } = build();
    const { id } = await reportOne(service);
    for (const step of BREACH_STEPS.slice(1)) {
      await service.completeStep(id, step, { note: `did ${step}` }, actor);
    }
    const breach = await service.get(id);
    expect(breach.currentStep).toBeNull();
    expect(breach.closedAt).not.toBeNull();
    expect(breach.steps.every((s) => s.completed)).toBe(true);
    expect(breach.steps[2]).toMatchObject({ note: 'did tell_board', completedByName: 'Asha' });

    const actions = vi.mocked(activity.record).mock.calls.map(([call]) => call.action);
    expect(actions).toEqual([
      'BREACH_REPORTED',
      'BREACH_STEP_COMPLETED',
      'BREACH_STEP_COMPLETED',
      'BREACH_STEP_COMPLETED',
      'BREACH_CLOSED',
    ]);
    expect(vi.mocked(activity.record).mock.calls[2]![0].details).toEqual({
      title: details.title,
      step: 'tell_board',
    });
  });

  it('refuses a step out of order', async () => {
    const { service, repository } = build();
    const { id } = await reportOne(service);
    await failsWith(service.completeStep(id, 'tell_board', {}, actor), 'STEP_ORDER', 409);
    expect(repository.addStep).not.toHaveBeenCalled();
  });

  it('refuses to close before the Board and the people are told', async () => {
    const { service } = build();
    const { id } = await reportOne(service);
    await service.completeStep(id, 'assess', {}, actor);
    await failsWith(service.completeStep(id, 'close', {}, actor), 'STEP_ORDER', 409);
    await service.completeStep(id, 'tell_board', {}, actor);
    await failsWith(service.completeStep(id, 'close', {}, actor), 'STEP_ORDER', 409);
  });

  it('refuses a step that is already done, including found', async () => {
    const { service } = build();
    const { id } = await reportOne(service);
    await service.completeStep(id, 'assess', {}, actor);
    await failsWith(service.completeStep(id, 'assess', {}, actor), 'STEP_ORDER', 409);
    await failsWith(service.completeStep(id, 'found', {}, actor), 'STEP_ORDER', 409);
  });

  it('stops the clock once the Board is told', async () => {
    const { service } = build();
    const { id } = await reportOne(service, new Date(Date.now() - 80 * HOUR));
    await service.completeStep(id, 'assess', {}, actor);
    expect((await service.get(id)).overdue).toBe(true);
    expect((await service.completeStep(id, 'tell_board', {}, actor)).overdue).toBe(false);
  });
});

describe('BreachesService.update', () => {
  const change = {
    ...details,
    title: 'New title',
    foundAt: new Date(Date.now() - HOUR),
    peopleAffected: null,
    assigneeId: null,
  };

  it('changes the details while the breach is open, and records it', async () => {
    const { service, activity } = build();
    const { id } = await reportOne(service);
    const breach = await service.update(id, change, actor);
    expect(breach).toMatchObject({ title: 'New title', peopleAffected: null });
    expect(activity.record).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'BREACH_EDITED', details: { title: 'New title' } }),
    );
  });

  it('refuses once the breach is closed', async () => {
    const { service, repository } = build();
    const { id } = await reportOne(service);
    for (const step of BREACH_STEPS.slice(1) as BreachStep[]) {
      await service.completeStep(id, step, {}, actor);
    }
    await failsWith(service.update(id, change, actor), 'BREACH_CLOSED', 409);
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('BreachesService assignee', () => {
  const assignedActions = (activity: ActivityService) =>
    vi
      .mocked(activity.record)
      .mock.calls.map(([call]) => call)
      .filter((call) => call.action === 'BREACH_ASSIGNED');

  it('is nobody by default and records no assignment', async () => {
    const { service, activity } = build();
    const breach = await reportOne(service);
    expect(breach.assignee).toBeNull();
    expect(assignedActions(activity)).toEqual([]);
  });

  it('can be set when reporting, and the assignment is recorded after the report', async () => {
    const { service, activity } = build();
    const breach = await service.create({ ...details, assigneeId: 'p1' }, actor);
    expect(breach.assignee).toEqual({ id: 'p1', name: 'Ravi Kumar' });
    const calls = vi.mocked(activity.record).mock.calls.map(([call]) => call);
    expect(calls.map((call) => call.action)).toEqual(['BREACH_REPORTED', 'BREACH_ASSIGNED']);
    expect(calls[1]).toMatchObject({
      details: { title: details.title },
      before: { value: '' },
      after: { value: 'Ravi Kumar' },
    });
  });

  it('refuses someone who has left or does not exist, and saves nothing', async () => {
    const { service, repository } = build();
    await failsWith(
      service.create({ ...details, assigneeId: 'gone' }, actor),
      'VALIDATION_FAILED',
      400,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('records a change once, with the names, and only the assignment when nothing else changed', async () => {
    const { service, activity } = build();
    const created = await service.create(
      { ...details, foundAt: new Date(), assigneeId: 'p1' },
      actor,
    );
    const current = await service.get(created.id);
    const same = {
      ...details,
      foundAt: new Date(current.foundAt),
      peopleAffected: null,
    };
    vi.mocked(activity.record).mockClear();

    await service.update(created.id, { ...same, assigneeId: 'p2' }, actor);
    expect(assignedActions(activity)).toHaveLength(1);
    expect(assignedActions(activity)[0]).toMatchObject({
      before: { value: 'Ravi Kumar' },
      after: { value: 'Meera Shah' },
    });
    expect(activity.record).toHaveBeenCalledTimes(1);

    vi.mocked(activity.record).mockClear();
    await service.update(created.id, { ...same, assigneeId: null }, actor);
    expect(assignedActions(activity)[0]).toMatchObject({
      before: { value: 'Meera Shah' },
      after: { value: '' },
    });
  });

  it('records nothing when nothing changes', async () => {
    const { service, activity } = build();
    const created = await service.create({ ...details, assigneeId: 'p1' }, actor);
    const current = await service.get(created.id);
    vi.mocked(activity.record).mockClear();
    await service.update(
      created.id,
      { ...details, foundAt: new Date(current.foundAt), peopleAffected: null, assigneeId: 'p1' },
      actor,
    );
    expect(activity.record).not.toHaveBeenCalled();
  });

  it('refuses a person who has left on edit', async () => {
    const { service, repository } = build();
    const { id } = await reportOne(service);
    await failsWith(
      service.update(
        id,
        { ...details, foundAt: new Date(), peopleAffected: null, assigneeId: 'gone' },
        actor,
      ),
      'VALIDATION_FAILED',
      400,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('cannot be changed once the breach is closed', async () => {
    const { service } = build();
    const { id } = await reportOne(service);
    for (const step of BREACH_STEPS.slice(1) as BreachStep[]) {
      await service.completeStep(id, step, {}, actor);
    }
    await failsWith(
      service.update(
        id,
        { ...details, foundAt: new Date(), peopleAffected: null, assigneeId: 'p1' },
        actor,
      ),
      'BREACH_CLOSED',
      409,
    );
  });

  it('shows the name in the list and not the id', async () => {
    const { service } = build();
    await service.create({ ...details, assigneeId: 'p2' }, actor);
    const [item] = (await service.list({ tab: 'open', page: 1, limit: 25 })).items;
    expect(item).toMatchObject({ assigneeName: 'Meera Shah' });
    expect(item).not.toHaveProperty('assigneeId');
  });
});

describe('BreachesService.get', () => {
  it('is not found for an unknown breach, whatever is asked', async () => {
    const { service } = build();
    await failsWith(service.get('nope'), 'NOT_FOUND', 404);
    await failsWith(
      service.update(
        'nope',
        { ...details, foundAt: new Date(), peopleAffected: null, assigneeId: null },
        actor,
      ),
      'NOT_FOUND',
      404,
    );
    await failsWith(service.completeStep('nope', 'assess', {}, actor), 'NOT_FOUND', 404);
  });
});

describe('BreachesService.list', () => {
  it('sends the open breaches and the counts', async () => {
    const { service } = build();
    await reportOne(service);
    await reportOne(service, new Date(Date.now() - 80 * HOUR));
    const result = await service.list({ tab: 'open', page: 1, limit: 25 });
    expect(result.total).toBe(2);
    expect(result.counts).toEqual({ open: 2, closed: 0, overdue: 1 });
    expect(result.items[0]).toMatchObject({ overdue: true });
    expect(result.items[0]).not.toHaveProperty('description');
  });
});
