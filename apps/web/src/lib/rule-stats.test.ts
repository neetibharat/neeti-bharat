import type { PolicyResponse, ProofCounts, RuleResponse } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { policiesOfRule, ruleStats } from './rule-stats';

const control = (id: string, status: string, policyIds: string[]) => ({
  id,
  status,
  policies: policyIds.map((p) => ({ id: p, title: p })),
});

const rule = {
  id: 'R6',
  controls: [control('a', 'done', ['P1']), control('b', 'in_progress', ['P1', 'P2'])],
} as unknown as RuleResponse;

const policy = (id: string, status: string) => ({ id, status }) as unknown as PolicyResponse;
const policies = [policy('P1', 'approved'), policy('P2', 'draft'), policy('P9', 'approved')];
const counts = (all: number, provided: number): ProofCounts => ({
  all,
  provided,
  overdue: 0,
  missing: all - provided,
  due: 0,
});

describe('rule stats', () => {
  it('picks the policies that belong to the rule', () => {
    expect(policiesOfRule(rule, policies).map((p) => p.id)).toEqual(['P1', 'P2']);
  });

  it('counts controls done, policies approved and proof in', () => {
    expect(ruleStats(rule, policies, counts(2, 1))).toEqual({
      controls: { done: 1, total: 2, percent: 50 },
      policies: { done: 1, total: 2, percent: 50 },
      proof: { done: 1, total: 2, percent: 50 },
    });
  });

  it('is zero, not a division error, when a rule has no policies or proof', () => {
    const bare = { id: 'R1', controls: [] } as unknown as RuleResponse;
    expect(ruleStats(bare, policies, counts(0, 0)).proof).toEqual({
      done: 0,
      total: 0,
      percent: 0,
    });
  });
});
