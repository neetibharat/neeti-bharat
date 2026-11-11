import type { PolicyStatus } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import type { ControlRow, PolicyBriefs } from './checklist-view';
import { myWorkItems, workloadOf, type MyWorkInput, type WorkPolicy } from './my-work';

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
