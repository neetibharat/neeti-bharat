import type { ControlResponse, RuleResponse } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { applyingControls, policyIdsOf, progressOf, ruleHeading } from './rule-progress';

const control = (status: ControlResponse['status'], policyIds: string[] = []): ControlResponse => ({
  id: 'c',
  frameworkId: 'dpdp',
  title: 't',
  description: 'd',
  policies: policyIds.map((id) => ({ id, title: id })),
  status,
  ownerRole: 'DPO',
  ownerIsDefault: true,
  ownerName: null,
  requirementId: 'R1',
  isCustom: false,
  assignee: null,
  reviewDate: null,
  evidenceCount: 0,
  proofRequired: 0,
  proofProvided: 0,
  policiesApproved: 0,
  policiesTotal: policyIds.length,
});

describe('progressOf', () => {
  it('is not started when nothing has moved', () => {
    expect(progressOf([control('not_started'), control('not_started')])).toMatchObject({
      done: 0,
      percent: 0,
      status: 'notStarted',
    });
  });

  it('is in progress once any control moves, and only done ones count', () => {
    expect(progressOf([control('done'), control('in_progress'), control('not_started')])).toEqual({
      done: 1,
      total: 3,
      percent: 33,
      status: 'inProgress',
    });
  });

  it('is done when every control is done', () => {
    expect(progressOf([control('done'), control('done')])).toMatchObject({
      percent: 100,
      status: 'done',
    });
  });

  it('copes with no controls', () => {
    expect(progressOf([])).toEqual({ done: 0, total: 0, percent: 0, status: 'notStarted' });
  });
});

describe('policyIdsOf', () => {
  it('lists each policy once, in order', () => {
    const rule = { controls: [control('done', ['P05', 'P16']), control('done', ['P04', 'P05'])] };
    expect(policyIdsOf(rule as RuleResponse)).toEqual(['P04', 'P05', 'P16']);
  });
});

describe('applyingControls', () => {
  it('leaves out the controls of rules that are switched off', () => {
    const on = { applies: true, controls: [control('done'), control('done')] };
    const off = { applies: false, controls: [control('not_started')] };
    expect(applyingControls([on, off] as RuleResponse[])).toHaveLength(2);
  });
});

describe('ruleHeading', () => {
  it('numbers a rule, and leaves the organisation group as its title', () => {
    expect(ruleHeading({ id: 'R7', reference: 'Rule 7', title: 'Breach' } as RuleResponse)).toBe(
      'Rule 7 · Breach',
    );
    expect(
      ruleHeading({
        id: 'ORG',
        reference: 'Organisation',
        title: 'Organisation-wide',
      } as RuleResponse),
    ).toBe('Organisation-wide');
  });
});
