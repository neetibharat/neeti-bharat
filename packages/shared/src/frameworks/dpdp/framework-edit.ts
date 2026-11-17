import type { ControlStatus } from './checklist.js';

export const FRAMEWORK_NAME_MAX_LENGTH = 80;
export const FRAMEWORK_ABOUT_MAX_LENGTH = 200;
export const FRAMEWORK_SEAL_MAX_LENGTH = 8;

export const REQUIREMENT_REFERENCE_MAX_LENGTH = 24;
export const REQUIREMENT_TITLE_MAX_LENGTH = 120;
export const REQUIREMENT_SUMMARY_MAX_LENGTH = 600;

/** Set to true to close the built-in frameworks and their rules to changes. Controls, policies and proof stay open. */
export const BUILT_IN_LOCKED = false;

/** Whether a framework or rule can no longer be changed. `locked` is only passed in tests. */
export function isLocked(isBuiltIn: boolean, locked: boolean = BUILT_IN_LOCKED): boolean {
  return locked && isBuiltIn;
}

/** What a company can say about a framework. A built-in one can only change while `BUILT_IN_LOCKED` is false. */
export interface SaveFrameworkRequest {
  name: string;
  /** One sentence on what it is. */
  about: string;
  /** The short mark on its badge, such as ACME. */
  seal: string;
}

/** What a company can say about a rule. */
export interface SaveRequirementRequest {
  /** How it is numbered or named, such as "4.2". */
  reference: string;
  title: string;
  summary: string;
}

/** One control a policy answers, with the framework and rule it sits under. */
export interface PolicyCoverageItem {
  framework: { id: string; name: string; seal: string };
  rule: { id: string; reference: string; title: string };
  control: { id: string; title: string; status: ControlStatus };
}

/** Every control a policy covers, across all frameworks, from `GET /v1/policies/:id/coverage`. */
export interface PolicyCoverageResponse {
  items: PolicyCoverageItem[];
}
