import { describe, expect, it } from 'vitest';
import { countTabs, deadlineItems, tabOf, type DeadlineInput } from './deadlines';

const now = new Date('2026-11-20T10:00:00.000Z');
const hours = (n: number) => new Date(now.getTime() + n * 3_600_000);

const empty: DeadlineInput = {
  controls: [],
  policies: [],
  breaches: [],
  requests: [],
  vendors: [],
  training: [],
  names: new Map([['p1', 'Priya']]),
  now,
};

const request = (id: string, due: number) => ({
  id,
  type: 'access' as const,
  personName: id,
  dueAt: hours(due),
  overdue: due < 0,
  assigneeId: null,
});

describe('deadlineItems', () => {
  it('dates an open breach by the Board deadline, and names who has it', () => {
    const breach = {
      id: 'b1',
      title: 'Leak',
      currentStep: 'assess' as const,
      reportDueAt: hours(20),
      overdue: false,
      assigneeId: 'p1',
    };
    const [item] = deadlineItems({ ...empty, breaches: [breach] });
    expect(item).toMatchObject({ kind: 'breach', assigneeName: 'Priya', overdue: false });
  });

  it('leaves out a vendor review that is far off, and keeps one that is late', () => {
    const vendor = { id: 'v1', name: 'Twilio', ownerId: null, reviewDueOn: hours(24 * 90) };
    expect(deadlineItems({ ...empty, vendors: [vendor] })).toHaveLength(0);
    const late = { ...vendor, reviewDueOn: hours(-48) };
    expect(deadlineItems({ ...empty, vendors: [late] })[0]).toMatchObject({
      kind: 'vendor',
      overdue: true,
      assigneeName: null,
    });
  });

  it('puts the earliest first', () => {
    const requests = [request('r2', 48), request('r1', -5)];
    expect(deadlineItems({ ...empty, requests }).map((item) => item.id)).toEqual(['r1', 'r2']);
  });
});

describe('tabs', () => {
  it('splits late, this week and later', () => {
    const requests = [request('r0', -5), request('r1', 30), request('r2', 24 * 20)];
    const items = deadlineItems({ ...empty, requests });
    expect(items.map((item) => tabOf(item, now))).toEqual(['overdue', 'week', 'later']);
    expect(countTabs(items, now)).toEqual({ overdue: 1, week: 1, later: 1 });
  });
});
