import {
  ORGANISATION_RULE_ID,
  type ControlResponse,
  type RuleResponse,
} from '@neeti-bharat/shared';
import { percentOf } from './percent';

export type RuleStatus = 'notStarted' | 'inProgress' | 'done';

export interface Progress {
  done: number;
  total: number;
  /** 0 to 100, whole numbers. */
  percent: number;
  status: RuleStatus;
}

/** How far along a set of controls is. Only "done" counts towards the percentage. */
export function progressOf(controls: ControlResponse[]): Progress {
  const total = controls.length;
  const done = controls.filter((control) => control.status === 'done').length;
  const started = controls.some((control) => control.status !== 'not_started');
  const status = total > 0 && done === total ? 'done' : started ? 'inProgress' : 'notStarted';
  return { done, total, percent: percentOf(done, total), status };
}

/** The controls that count towards progress: those of the rules that apply to the company. */
export function applyingControls(rules: RuleResponse[]): ControlResponse[] {
  return rules.filter((rule) => rule.applies).flatMap((rule) => rule.controls);
}

/** The ids of the policies behind a rule's controls, in order, each once. */
export function policyIdsOf(rule: RuleResponse): string[] {
  const ids = rule.controls.flatMap((control) => control.policies.map((policy) => policy.id));
  return [...new Set(ids)].sort();
}

/** "Rule 7 · Breach notification". The organisation group has no rule number, so it is just its title. */
export function ruleHeading(rule: RuleResponse): string {
  return rule.id === ORGANISATION_RULE_ID ? rule.title : `${rule.reference} · ${rule.title}`;
}
