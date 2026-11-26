import {
  type ControlResponse,
  type FrameworkResponse,
  type FrameworkSummaryResponse,
  type PolicyCoverageItem,
  type RuleResponse,
} from '@neeti-bharat/shared';
import {
  controlView,
  type ControlRow,
  type PolicyBriefs,
  type RoleHolders,
} from './checklist-view';

/** The stored framework as the screens see it. */
export const frameworkView = (row: FrameworkResponse): FrameworkResponse => ({
  id: row.id,
  name: row.name,
  about: row.about,
  seal: row.seal,
  isBuiltIn: row.isBuiltIn,
});

/** A framework with how far along it is. Rules switched off by the company's answers are left out of the counts. */
export function summaryOf(row: FrameworkResponse, rules: RuleResponse[]): FrameworkSummaryResponse {
  const controls = rules.filter((rule) => rule.applies).flatMap((rule) => rule.controls);
  return {
    ...frameworkView(row),
    controlsDone: controls.filter((control) => control.status === 'done').length,
    controlsTotal: controls.length,
  };
}

/** Everything needed to say where a control sits: the frameworks and rules, the controls, and who owns what. */
export interface CoverageInput {
  frameworks: (FrameworkResponse & { sortOrder?: number })[];
  requirements: { id: string; frameworkId: string; reference: string; title: string }[];
  controls: ControlRow[];
  briefs: PolicyBriefs;
  holders: RoleHolders;
}

/** A control reduced to what the coverage list shows. */
const briefOf = ({ id, title, status }: ControlResponse) => ({ id, title, status });

/** The controls a policy covers, in framework order then rule order, each with where it sits. */
export function coverageOf(policyId: string, input: CoverageInput): PolicyCoverageItem[] {
  return input.frameworks.flatMap((framework) =>
    input.requirements
      .filter((rule) => rule.frameworkId === framework.id)
      .flatMap((rule) =>
        input.controls
          .filter(
            (c) => c.requirementId === rule.id && c.policies.some((p) => p.policyId === policyId),
          )
          .map((control) => ({
            framework: { id: framework.id, name: framework.name, seal: framework.seal },
            rule: { id: rule.id, reference: rule.reference, title: rule.title },
            control: briefOf(controlView(control, input.briefs, input.holders)),
          })),
      ),
  );
}
