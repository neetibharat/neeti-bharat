import { CONTROLS } from './controls.js';
import { POLICIES } from './policies.js';
import { RULES } from './rules.js';
import type { DpdpControl } from './types.js';

export * from './types.js';

export const DPDP_RULES = RULES;
export const DPDP_CONTROLS = CONTROLS;
export const DPDP_POLICIES = POLICIES;

export function controlsForRule(ruleId: string): DpdpControl[] {
  return DPDP_CONTROLS.filter((control) => control.ruleId === ruleId);
}

export function controlsForPolicy(policyId: string): DpdpControl[] {
  return DPDP_CONTROLS.filter((control) => control.policyIds.includes(policyId));
}
