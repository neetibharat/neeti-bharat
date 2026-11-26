import type { RuleResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import type { ControlRow, PolicyBriefs } from './checklist-view';
import { coverageOf, summaryOf } from './framework-view';

const dpdp = { id: 'dpdp', name: 'DPDP', about: 'Law', seal: 'DPDP', isBuiltIn: true };
const acme = { id: 'custom-f1', name: 'Acme', about: 'Ours', seal: 'ACME', isBuiltIn: false };

const control = (id: string, frameworkId: string, requirementId: string, policyIds: string[]) =>
  ({
    id,
    frameworkId,
    requirementId,
    title: id,
    description: '',
    ownerRole: 'DPO',
    templateId: null,
    assignee: null,
    reviewDate: null,
    policies: policyIds.map((policyId) => ({ policyId })),
    _count: { evidence: 0 },
    proofRequirements: [],
  }) as ControlRow;

const rules = [
  { id: 'R6', frameworkId: 'dpdp', reference: 'Rule 6', title: 'Security' },
  { id: 'custom-r1', frameworkId: 'custom-f1', reference: '4.2', title: 'Access reviews' },
];

describe('coverageOf', () => {
  it('finds a policy’s controls in every framework, each with its rule and framework', () => {
    const items = coverageOf('P05', {
      frameworks: [dpdp, acme],
      requirements: rules,
      controls: [
        control('a', 'dpdp', 'R6', ['P05']),
        control('b', 'custom-f1', 'custom-r1', ['P05', 'P01']),
        control('c', 'dpdp', 'R6', ['P01']),
      ],
      briefs: new Map() as PolicyBriefs,
      holders: {},
    });
    expect(items.map((i) => [i.framework.seal, i.rule.reference, i.control.id])).toEqual([
      ['DPDP', 'Rule 6', 'a'],
      ['ACME', '4.2', 'b'],
    ]);
  });

  it('lists the frameworks in order even when a rule of a later one sorts first', () => {
    const items = coverageOf('P05', {
      frameworks: [dpdp, acme],
      requirements: [rules[1]!, rules[0]!],
      controls: [
        control('a', 'dpdp', 'R6', ['P05']),
        control('b', 'custom-f1', 'custom-r1', ['P05']),
      ],
      briefs: new Map() as PolicyBriefs,
      holders: {},
    });
    expect(items.map((i) => i.framework.seal)).toEqual(['DPDP', 'ACME']);
  });

  it('leaves out controls under a framework that is not active', () => {
    const items = coverageOf('P05', {
      frameworks: [dpdp],
      requirements: rules,
      controls: [control('b', 'custom-f1', 'custom-r1', ['P05'])],
      briefs: new Map() as PolicyBriefs,
      holders: {},
    });
    expect(items).toEqual([]);
  });
});

describe('summaryOf', () => {
  const rule = (id: string, applies: boolean, statuses: string[]) =>
    ({
      id,
      applies,
      controls: statuses.map((status) => ({ status })),
    }) as unknown as RuleResponse;

  it('counts the controls of the rules that apply, and leaves out those of rules switched off', () => {
    const summary = summaryOf(dpdp, [
      rule('R6', true, ['done', 'not_started']),
      rule('R10', false, ['done']),
      rule('ORG', true, ['done']),
    ]);
    expect(summary).toMatchObject({
      controlsDone: 2,
      controlsTotal: 3,
    });
  });
});
