import type { PolicyResponse, ProofCounts, RuleResponse } from '@neeti-bharat/shared';
import { percentOf } from './percent';
import { policyIdsOf, progressOf } from './rule-progress';

export interface Pillar {
  done: number;
  total: number;
  /** 0 to 100, whole numbers. */
  percent: number;
}

export interface RuleStats {
  controls: Pillar;
  policies: Pillar;
  proof: Pillar;
}

const pillar = (done: number, total: number): Pillar => ({
  done,
  total,
  percent: percentOf(done, total),
});

/** The policies behind a rule's controls, each once, as the full policy rows. */
export function policiesOfRule(rule: RuleResponse, policies: PolicyResponse[]): PolicyResponse[] {
  const ids = new Set(policyIdsOf(rule));
  return policies.filter((policy) => ids.has(policy.id));
}

/** How far a rule is on each of the three things it needs: controls done, policies approved, proof in. */
export function ruleStats(
  rule: RuleResponse,
  policies: PolicyResponse[],
  proof: ProofCounts,
): RuleStats {
  const rulePolicies = policiesOfRule(rule, policies);
  const { done, total } = progressOf(rule.controls);
  return {
    controls: pillar(done, total),
    policies: pillar(
      rulePolicies.filter((p) => p.status === 'approved').length,
      rulePolicies.length,
    ),
    proof: pillar(proof.provided, proof.all),
  };
}
