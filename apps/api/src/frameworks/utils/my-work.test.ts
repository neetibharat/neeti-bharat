import type { PolicyStatus } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import type { ControlRow, PolicyBriefs } from './checklist-view';
import {
  myWorkItems,
  workloadOf,
  type MyWorkInput,
  type WorkBreach,
  type WorkRequest,
  type WorkPolicy,
  type WorkVendor,
} from './my-work';

const NOW = new Date('2026-11-10T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const requirement = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: `Proof ${id}`,
  frequency: 'yearly' as const,
  dueDate: null as Date | null,
  assignee: null as { id: string; name: string } | null,
  evidence: [] as { createdAt: Date }[],
  ...over,
});

const control = (over: Partial<ControlRow> = {}): ControlRow => ({
  id: 'c1',
  frameworkId: 'dpdp',
  requirementId: 'R6',
  title: 'Encryption',
  description: '',
  ownerRole: 'DPO',
  templateId: 'c1',
  assignee: null,
  reviewDate: null,
  policies: [],
  _count: { evidence: 0 },
  proofRequirements: [requirement('a')],
  ...over,
});

const policy = (id: string, status: PolicyStatus, over: Partial<WorkPolicy> = {}): WorkPolicy => ({
  id,
  title: `Policy ${id}`,
  status,
  ownerRole: 'DPO',
  approverId: null,
  approvedAt: null,
  ...over,
});

const input = (over: Partial<MyWorkInput> = {}): MyWorkInput => ({
  personId: 'me',
  roles: new Set(['DPO']),
  isAdmin: false,
  controls: [],
  policies: [],
  briefs: new Map() as PolicyBriefs,
  breaches: [],
  requests: [],
  vendors: [],
  training: [],
  now: NOW,
  ...over,
});

describe('proof work', () => {
  it('gives proof on a control whose job the person holds, until it is provided', () => {
    const items = myWorkItems(input({ controls: [control()] }));
    expect(items.map((i) => [i.kind, i.id, i.context])).toEqual([['proof', 'a', 'Encryption']]);
    const given = control({
      proofRequirements: [requirement('a', { evidence: [{ createdAt: daysAgo(5) }] })],
    });
    expect(myWorkItems(input({ controls: [given] }))).toEqual([]);
  });

  it('leaves out a control that belongs to someone else, by person or by job', () => {
    const named = control({ assignee: { id: 'other', name: 'Ravi' } });
    const otherJob = control({ ownerRole: 'SECURITY_LEAD' });
    expect(myWorkItems(input({ controls: [named, otherJob] }))).toEqual([]);
  });

  it('gives a requirement that names the person even on someone else’s control', () => {
    const named = control({
      ownerRole: 'SECURITY_LEAD',
      proofRequirements: [requirement('a', { assignee: { id: 'me', name: 'Me' } })],
    });
    expect(myWorkItems(input({ controls: [named] }))).toHaveLength(1);
  });

  it('takes a requirement away from the owner when it names somebody else', () => {
    const named = control({
      proofRequirements: [requirement('a', { assignee: { id: 'other', name: 'Ravi' } })],
    });
    expect(myWorkItems(input({ controls: [named] }))).toEqual([]);
  });

  it('flags proof whose due date has passed', () => {
    const late = control({ proofRequirements: [requirement('a', { dueDate: daysAgo(3) })] });
    expect(myWorkItems(input({ controls: [late] }))[0]).toMatchObject({ overdue: true });
  });
});

describe('policy work', () => {
  it('gives approval to the named approver, or to an admin when nobody is named', () => {
    const waiting = policy('P1', 'in_review', { approverId: 'me' });
    const unnamed = policy('P2', 'in_review');
    expect(myWorkItems(input({ policies: [waiting, unnamed] })).map((i) => i.id)).toEqual(['P1']);
    expect(myWorkItems(input({ policies: [unnamed], isAdmin: true })).map((i) => i.kind)).toEqual([
      'approve',
    ]);
    expect(
      myWorkItems(
        input({ policies: [policy('P3', 'in_review', { approverId: 'other' })], isAdmin: true }),
      ),
    ).toEqual([]);
  });

  it('gives drafts to the owner job, and reviews that are close or late', () => {
    const items = myWorkItems(
      input({
        policies: [
          policy('P1', 'draft'),
          policy('P2', 'approved', { approvedAt: daysAgo(380) }),
          policy('P3', 'approved', { approvedAt: daysAgo(10) }),
          policy('P4', 'draft', { ownerRole: 'SECURITY_LEAD' }),
        ],
      }),
    );
    expect(items.map((i) => [i.id, i.kind, i.overdue])).toEqual([
      ['P2', 'review', true],
      ['P1', 'draft', false],
    ]);
  });
});

const breach = (id: string, over: Partial<WorkBreach> = {}): WorkBreach => ({
  id,
  title: `Breach ${id}`,
  currentStep: 'assess',
  reportDueAt: new Date('2026-11-12T12:00:00Z'),
  overdue: false,
  assigneeId: null,
  ...over,
});

describe('breach work', () => {
  it('gives an open breach to whoever holds the DPO job, dated by the Board deadline', () => {
    expect(myWorkItems(input({ breaches: [breach('b1')] }))).toEqual([
      {
        kind: 'breach',
        id: 'b1',
        title: 'Breach b1',
        context: 'assess',
        dueOn: '2026-11-12T12:00:00.000Z',
        overdue: false,
      },
    ]);
  });

  it('gives it to an admin who does not hold the job, and to nobody else', () => {
    const items = [breach('b1')];
    expect(myWorkItems(input({ breaches: items, roles: new Set(), isAdmin: true }))).toHaveLength(
      1,
    );
    expect(myWorkItems(input({ breaches: items, roles: new Set(['SECURITY_LEAD']) }))).toEqual([]);
  });

  it('gives a breach that names someone to that person alone', () => {
    const items = [breach('b1', { assigneeId: 'me' })];
    expect(myWorkItems(input({ breaches: items, roles: new Set() }))).toHaveLength(1);
    const other = [breach('b1', { assigneeId: 'someone-else' })];
    expect(myWorkItems(input({ breaches: other }))).toEqual([]);
    expect(myWorkItems(input({ breaches: other, roles: new Set(), isAdmin: true }))).toEqual([]);
  });

  it('has no date once the Board is told, and flags a late report', () => {
    const told = breach('b1', { currentStep: 'tell_people' });
    const late = breach('b2', { overdue: true });
    const items = myWorkItems(input({ breaches: [told, late] }));
    expect(items.map((i) => [i.id, i.dueOn !== null, i.overdue])).toEqual([
      ['b2', true, true],
      ['b1', false, false],
    ]);
  });

  it('comes before approvals, proof and drafts, and after anything overdue and earlier', () => {
    const items = myWorkItems(
      input({
        controls: [control()],
        policies: [policy('A', 'in_review', { approverId: 'me' })],
        breaches: [breach('b1')],
      }),
    );
    expect(items.map((i) => i.kind)).toEqual(['breach', 'approve', 'proof']);
  });

  it('orders late breaches and late proof together, earliest deadline first', () => {
    const late = control({ proofRequirements: [requirement('a', { dueDate: daysAgo(1) })] });
    const items = myWorkItems(
      input({
        controls: [late],
        breaches: [breach('b1', { overdue: true, reportDueAt: daysAgo(2) })],
      }),
    );
    expect(items.map((i) => i.kind)).toEqual(['breach', 'proof']);
  });
});

const request = (id: string, over: Partial<WorkRequest> = {}): WorkRequest => ({
  id,
  type: 'access',
  personName: `Person ${id}`,
  dueAt: new Date('2026-12-01T00:00:00Z'),
  overdue: false,
  assigneeId: null,
  ...over,
});

describe('request work', () => {
  it('gives an open request to whoever holds the DPO job, dated by its due date', () => {
    expect(myWorkItems(input({ requests: [request('r1')] }))).toEqual([
      {
        kind: 'request',
        id: 'r1',
        title: 'Person r1',
        context: 'access',
        dueOn: '2026-12-01T00:00:00.000Z',
        overdue: false,
      },
    ]);
  });

  it('gives it to an admin who does not hold the job, and to nobody else', () => {
    const items = [request('r1')];
    expect(myWorkItems(input({ requests: items, roles: new Set(), isAdmin: true }))).toHaveLength(
      1,
    );
    expect(myWorkItems(input({ requests: items, roles: new Set(['SECURITY_LEAD']) }))).toEqual([]);
  });

  it('gives a request that names someone to that person alone', () => {
    const mine = [request('r1', { assigneeId: 'me' })];
    expect(myWorkItems(input({ requests: mine, roles: new Set() }))).toHaveLength(1);
    const other = [request('r1', { assigneeId: 'someone-else' })];
    expect(myWorkItems(input({ requests: other }))).toEqual([]);
    expect(myWorkItems(input({ requests: other, roles: new Set(), isAdmin: true }))).toEqual([]);
  });

  it('puts a late request first and one that is not late after breaches and before approvals', () => {
    const items = myWorkItems(
      input({
        policies: [policy('A', 'in_review', { approverId: 'me' })],
        breaches: [breach('b1')],
        requests: [
          request('r1'),
          request('r2', { overdue: true, dueAt: new Date('2026-11-01T00:00:00Z') }),
        ],
      }),
    );
    expect(items.map((i) => i.id)).toEqual(['r2', 'b1', 'r1', 'A']);
  });
});

describe('order', () => {
  it('puts overdue first, then approvals, reviews, proof and drafts', () => {
    const items = myWorkItems(
      input({
        controls: [control()],
        policies: [policy('D', 'draft'), policy('A', 'in_review', { approverId: 'me' })],
      }),
    );
    expect(items.map((i) => i.kind)).toEqual(['approve', 'proof', 'draft']);
  });
});

describe('workloadOf', () => {
  it('counts each kind, and what is overdue', () => {
    const item = (kind: 'proof' | 'approve' | 'review' | 'draft', overdue = false) => ({
      kind,
      id: kind,
      title: kind,
      context: '',
      dueOn: null,
      overdue,
    });
    expect(
      workloadOf('p1', [
        item('proof', true),
        item('proof'),
        item('approve'),
        item('review'),
        item('draft'),
      ]),
    ).toEqual({ personId: 'p1', open: 5, overdue: 1 });
  });
});

describe('vendor work', () => {
  const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
  const vendor = (over: Partial<WorkVendor> = {}): WorkVendor => ({
    id: 'v1',
    name: 'Acme Payroll',
    ownerId: 'me',
    reviewDueOn: null,
    ...over,
  });

  it('gives a review that is close, with its date, and one that is late', () => {
    const [soon] = myWorkItems(input({ vendors: [vendor({ reviewDueOn: daysAhead(10) })] }));
    expect(soon).toMatchObject({ kind: 'vendor', id: 'v1', context: 'review', overdue: false });
    expect(soon!.dueOn).toBe(daysAhead(10).toISOString());
    const [late] = myWorkItems(input({ vendors: [vendor({ reviewDueOn: daysAgo(2) })] }));
    expect(late).toMatchObject({ context: 'review', overdue: true });
  });

  it('gives nothing for a date that is far off or not set', () => {
    expect(myWorkItems(input({ vendors: [vendor({ reviewDueOn: daysAhead(90) })] }))).toEqual([]);
    expect(myWorkItems(input({ vendors: [vendor()] }))).toEqual([]);
  });

  it('is the named owner’s, or the DPO’s and the admins’ when nobody is named', () => {
    const due = { reviewDueOn: daysAgo(1) };
    expect(myWorkItems(input({ vendors: [vendor({ ...due, ownerId: 'other' })] }))).toEqual([]);
    expect(myWorkItems(input({ vendors: [vendor({ ...due, ownerId: null })] }))).toHaveLength(1);
    const outsider = input({ roles: new Set(), vendors: [vendor({ ...due, ownerId: null })] });
    expect(myWorkItems(outsider)).toEqual([]);
    expect(myWorkItems({ ...outsider, isAdmin: true })).toHaveLength(1);
  });
});

describe('training work', () => {
  const due = (personId: string, dueOn: Date) => ({ personId, id: 't1', name: 'Awareness', dueOn });

  it('is the person’s own, late once its day has passed', () => {
    const soon = new Date(NOW.getTime() + 5 * 86_400_000);
    const [mine] = myWorkItems(input({ training: [due('me', soon), due('other', soon)] }));
    expect(mine).toMatchObject({ kind: 'training', id: 't1', title: 'Awareness', overdue: false });
    expect(myWorkItems(input({ training: [due('other', soon)] }))).toEqual([]);
    const [late] = myWorkItems(input({ training: [due('me', daysAgo(2))] }));
    expect(late).toMatchObject({ kind: 'training', overdue: true });
  });
});
