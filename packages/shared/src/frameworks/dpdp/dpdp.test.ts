import { describe, expect, it } from 'vitest';
import { JOB_ROLES } from '../../people.js';
import { PROFILE_FIELDS } from '../../profile.js';
import {
  controlsForPolicy,
  controlsForRule,
  DPDP_CONTROLS,
  DPDP_POLICIES,
  DPDP_RULES,
  ORGANISATION_RULE_ID,
} from './index.js';
import { POLICY_TEXTS } from './policy-texts/index.js';

const unique = (values: readonly string[]) => new Set(values).size === values.length;

describe('DPDP framework data', () => {
  it('has the agreed amount of each', () => {
    expect(DPDP_RULES).toHaveLength(13);
    expect(DPDP_CONTROLS).toHaveLength(47);
    expect(DPDP_POLICIES).toHaveLength(19);
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

  it('names an owner role that exists', () => {
    for (const policy of DPDP_POLICIES) expect(JOB_ROLES, policy.id).toContain(policy.ownerRole);
  });

  it('has counsel’s text for every policy, and none for a policy that does not exist', () => {
    const ids = DPDP_POLICIES.map((p) => p.id).sort();
    expect(Object.keys(POLICY_TEXTS).sort()).toEqual(ids);
    for (const id of ids) expect(POLICY_TEXTS[id]!.length, id).toBeGreaterThan(500);
  });

  it('only asks for company answers that exist', () => {
    const known = new Set<string>(PROFILE_FIELDS.map((field) => field.key));
    for (const [id, text] of Object.entries(POLICY_TEXTS)) {
      for (const [, key] of text.matchAll(/\{\{(\w+)\}\}/g))
        expect(known.has(key!), `${id} ${key}`).toBe(true);
    }
  });
});
