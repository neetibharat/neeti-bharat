import type { JobRole, PolicyStatus } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import {
  buildChecklist,
  controlView,
  defaultOwnerFor,
  proofItems,
  tallyProof,
  type ControlRow,
} from './checklist-view';

const brief = (id: string, title: string, ownerRole: JobRole, status: PolicyStatus = 'draft') =>
  [id, { id, title, ownerRole, status }] as const;

const policiesWith = (p08: PolicyStatus = 'draft') =>
  new Map([
    brief('P08', 'Incident Response Policy', 'DPO', p08),
    brief('P03', 'Information Security Policy', 'SECURITY_LEAD'),
  ]);
const policies = policiesWith();

const row = (over: Partial<ControlRow> = {}): ControlRow => ({
  id: 'DPDP-R7-02',
  frameworkId: 'dpdp',
  requirementId: 'R7',
  title: 'Board intimation',
  description: 'The Board is intimated.',
  ownerRole: null,
  templateId: 'DPDP-R7-02',
  assignee: null,
  reviewDate: null,
  policies: [{ policyId: 'P08' }],
  _count: { evidence: 0 },
  proofRequirements: [],
  ...over,
});

const noAnswers = { children: false, abroad: false, sdf: false };

describe('controlView', () => {
  it('starts owned by the primary policy’s owner, with its policies named', () => {
    const view = controlView(row(), policies, {});
    expect(view).toMatchObject({ status: 'not_started', ownerRole: 'DPO', ownerIsDefault: true });
    expect(view.policies).toEqual([{ id: 'P08', title: 'Incident Response Policy' }]);
  });

  it('uses the stored owner, and names who holds it', () => {
    const view = controlView(row({ ownerRole: 'SECURITY_LEAD' }), policies, {
      SECURITY_LEAD: 'Ravi',
    });
    expect(view).toMatchObject({
      ownerRole: 'SECURITY_LEAD',
      ownerIsDefault: false,
      ownerName: 'Ravi',
    });
  });

  it('leaves out a policy that is no longer there', () => {
    const view = controlView(
      row({ policies: [{ policyId: 'P99' }, { policyId: 'P08' }] }),
      policies,
      {},
    );
    expect(view.policies.map((policy) => policy.id)).toEqual(['P08']);
    expect(view.policiesTotal).toBe(1);
  });
});

describe('controlView status', () => {
  it('follows the policies and the proof: not started, in progress, then done', () => {
    expect(controlView(row(), policiesWith('draft'), {}).status).toBe('not_started');
    expect(controlView(row(), policiesWith('in_review'), {}).status).toBe('in_progress');
    expect(controlView(row(), policiesWith('approved'), {}).status).toBe('in_progress');
    const proved = row({ _count: { evidence: 2 } });
    expect(controlView(proved, policiesWith('approved'), {}).status).toBe('done');
    expect(controlView(proved, policiesWith('draft'), {}).status).toBe('in_progress');
  });

  it('counts how many of its policies are approved', () => {
    const both = new Map([
      brief('P08', 'Incident', 'DPO', 'approved'),
      brief('P03', 'InfoSec', 'SECURITY_LEAD', 'draft'),
    ]);
    const view = controlView(
      row({ policies: [{ policyId: 'P08' }, { policyId: 'P03' }] }),
      both,
      {},
    );
    expect(view).toMatchObject({ policiesApproved: 1, policiesTotal: 2, status: 'in_progress' });
  });

  it('needs only proof when no policy covers it', () => {
    expect(controlView(row({ policies: [], _count: { evidence: 1 } }), policies, {}).status).toBe(
      'done',
    );
    expect(controlView(row({ policies: [] }), policies, {}).status).toBe('not_started');
  });
});

describe('controlView details', () => {
  it('marks a control the company added, and shows its person and review date', () => {
    const view = controlView(
      row({
        templateId: null,
        assignee: { id: 'p1', name: 'Priya' },
        reviewDate: new Date('2027-03-31T00:00:00.000Z'),
      }),
      policies,
      {},
    );
    expect(view).toMatchObject({
      isCustom: true,
      assignee: { id: 'p1', name: 'Priya' },
      reviewDate: '2027-03-31',
      requirementId: 'R7',
    });
    expect(controlView(row(), policies, {})).toMatchObject({
      isCustom: false,
      assignee: null,
      reviewDate: null,
    });
  });
});

describe('defaultOwnerFor', () => {
  it('sends organisation-wide controls to the DPO, and a control with no policy too', () => {
    const org = row({ requirementId: 'ORG', policies: [{ policyId: 'P03' }] });
    expect(defaultOwnerFor(org, policies)).toBe('DPO');
    expect(defaultOwnerFor(row({ policies: [] }), policies)).toBe('DPO');
  });
});

describe('buildChecklist', () => {
  it('counts the controls that are done in each rule', () => {
    const rules = buildChecklist(
      [
        {
          id: 'R7',
          frameworkId: 'dpdp',
          templateId: 'x',
          reference: 'Rule 7',
          title: 'Breach',
          summary: 's',
          appliesWhen: 'always',
        },
        {
          id: 'ORG',
          frameworkId: 'dpdp',
          templateId: 'x',
          reference: 'Organisation',
          title: 'Org',
          summary: 's',
          appliesWhen: 'always',
        },
      ],
      [row({ id: 'a', _count: { evidence: 1 } }), row({ id: 'b' })],
      policiesWith('approved'),
      {},
      noAnswers,
    );
    expect(rules.find((rule) => rule.id === 'R7')?.controls.map((c) => c.status)).toEqual([
      'done',
      'in_progress',
    ]);
  });
});

const NOW = new Date('2026-11-10T00:00:00Z');
const given = (daysAgo: number) => ({ createdAt: new Date(NOW.getTime() - daysAgo * 86_400_000) });
const requirement = (id: string, evidence: { createdAt: Date }[], frequency = 'yearly') => ({
  id,
  title: `Proof ${id}`,
  frequency: frequency as 'yearly',
  dueDate: null as Date | null,
  assignee: null as { id: string; name: string } | null,
  evidence,
});

describe('proof requirements and status', () => {
  it('counts only requirements whose proof is in and still good', () => {
    const control = row({
      _count: { evidence: 2 },
      proofRequirements: [
        requirement('a', [given(10)]),
        requirement('b', []),
        requirement('c', [given(500)]),
      ],
    });
    expect(tallyProof(control, NOW)).toEqual({ required: 3, provided: 1, attached: 2 });
  });

  it('is done only when every requirement is provided and the policies are approved', () => {
    const complete = row({
      _count: { evidence: 2 },
      proofRequirements: [requirement('a', [given(1)]), requirement('b', [given(2)])],
    });
    expect(controlView(complete, policiesWith('approved'), {}, NOW)).toMatchObject({
      status: 'done',
      proofRequired: 2,
      proofProvided: 2,
    });
    const partial = row({
      _count: { evidence: 1 },
      proofRequirements: [requirement('a', [given(1)]), requirement('b', [])],
    });
    expect(controlView(partial, policiesWith('approved'), {}, NOW)).toMatchObject({
      status: 'in_progress',
      proofRequired: 2,
      proofProvided: 1,
    });
  });

  it('drops back once proof goes out of date', () => {
    const stale = row({
      _count: { evidence: 1 },
      proofRequirements: [requirement('a', [given(400)])],
    });
    expect(controlView(stale, policiesWith('approved'), {}, NOW).status).toBe('in_progress');
  });

  it('lists every requirement for the Proof page, with its control and owner', () => {
    const control = row({
      proofRequirements: [requirement('a', [given(5)]), requirement('b', [])],
    });
    const items = proofItems([control], policiesWith('approved'), { DPO: 'Meera' }, NOW);
    expect(items.map((item) => [item.id, item.status])).toEqual([
      ['a', 'provided'],
      ['b', 'missing'],
    ]);
    expect(items[0]).toMatchObject({
      controlId: 'DPDP-R7-02',
      ruleId: 'R7',
      ownerRole: 'DPO',
      ownerName: 'Meera',
    });
  });
});

describe('proof items', () => {
  const holders = {};
  const policies = new Map();
  const items = (over: Partial<ReturnType<typeof requirement>>, days?: number) =>
    proofItems(
      [
        row({
          proofRequirements: [
            { ...requirement('a', days === undefined ? [] : [given(days)]), ...over },
          ],
        }),
      ],
      policies,
      holders,
      NOW,
    );

  it('names who collects it and flags a due date that has passed with no proof', () => {
    const [item] = items({
      assignee: { id: 'p1', name: 'Ravi' },
      dueDate: new Date(NOW.getTime() - 86_400_000),
    });
    expect(item).toMatchObject({ assigneeName: 'Ravi', overdue: true, status: 'missing' });
  });

  it('is on time with a future due date, and due again once old proof runs out', () => {
    expect(items({ dueDate: new Date(NOW.getTime() + 86_400_000) })[0]).toMatchObject({
      overdue: false,
    });
    expect(items({}, 500)[0]).toMatchObject({ status: 'due', overdue: true });
    expect(items({}, 10)[0]).toMatchObject({ status: 'provided', overdue: false });
  });
});
