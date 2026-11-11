import { describe, expect, it } from 'vitest';
import { JOB_ROLES } from '../../people.js';
import {
  controlsForPolicy,
  controlsForRule,
  DPDP_CONTROLS,
  DPDP_POLICIES,
  DPDP_RULES,
  ORGANISATION_RULE_ID,
} from './index.js';

const unique = (values: readonly string[]) => new Set(values).size === values.length;

describe('DPDP framework data', () => {
  it('has the agreed amount of each', () => {
    expect(DPDP_RULES).toHaveLength(13);
    expect(DPDP_CONTROLS).toHaveLength(47);
    expect(DPDP_POLICIES).toHaveLength(18);
  });

  it('has unique ids', () => {
    expect(unique(DPDP_RULES.map((r) => r.id))).toBe(true);
    expect(unique(DPDP_CONTROLS.map((c) => c.id))).toBe(true);
    expect(unique(DPDP_POLICIES.map((p) => p.id))).toBe(true);
    expect(unique(DPDP_POLICIES.map((p) => p.slug))).toBe(true);
  });

  it('gives every rule a summary and at least one control', () => {
    for (const rule of DPDP_RULES) {
      expect(rule.summary.length, rule.id).toBeGreaterThan(20);
      expect(controlsForRule(rule.id).length, rule.id).toBeGreaterThan(0);
    }
  });

  it('puts every control under a real rule or the organisation', () => {
    const ruleIds = new Set([...DPDP_RULES.map((r) => r.id), ORGANISATION_RULE_ID]);
    for (const control of DPDP_CONTROLS) expect(ruleIds.has(control.ruleId), control.id).toBe(true);
  });

  it('only links controls to policies that exist, once each', () => {
    const policyIds = new Set(DPDP_POLICIES.map((p) => p.id));
    for (const control of DPDP_CONTROLS) {
      expect(unique(control.policyIds), control.id).toBe(true);
      for (const id of control.policyIds) expect(policyIds.has(id), control.id).toBe(true);
    }
  });

  it('covers every rule control with a policy, and every policy with a control', () => {
    for (const control of DPDP_CONTROLS.filter((c) => c.ruleId !== ORGANISATION_RULE_ID)) {
      expect(control.policyIds.length, control.id).toBeGreaterThan(0);
    }
    for (const policy of DPDP_POLICIES) {
      expect(controlsForPolicy(policy.id).length, policy.id).toBeGreaterThan(0);
    }
  });

  it('names an owner role that exists and lists the proof it needs', () => {
    for (const policy of DPDP_POLICIES) {
      expect(JOB_ROLES, policy.id).toContain(policy.ownerRole);
      expect(policy.evidence.length, policy.id).toBeGreaterThan(0);
    }
  });
});
