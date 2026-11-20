import { Injectable } from '@nestjs/common';
import { ControlRepository } from '../repositories/control.repository';
import { RuleReader } from './rule-reader';

/** A rule, with only the controls of it that one policy covers. */
export interface ScopeRule {
  id: string;
  frameworkId: string;
  reference: string;
  title: string;
  summary: string;
  controls: { id: string; title: string; description: string }[];
}

/** Read-only view of what a policy is meant to cover, for modules that read a policy against the rules. */
@Injectable()
export class PolicyScopeReader {
  constructor(
    private readonly controls: ControlRepository,
    private readonly rules: RuleReader,
  ) {}

  /** The rules whose controls this policy covers, in the rules' order, each with just those controls. */
  async rulesCoveredBy(policyId: string): Promise<ScopeRule[]> {
    const [controls, { requirements }] = await Promise.all([
      this.controls.findActive(),
      this.rules.everything(),
    ]);
    const mine = controls.filter((control) =>
      control.policies.some((link) => link.policyId === policyId),
    );
    return requirements.flatMap((rule) => {
      const covered = mine
        .filter((control) => control.requirementId === rule.id)
        .map(({ id, title, description }) => ({ id, title, description }));
      return covered.length === 0
        ? []
        : [
            {
              id: rule.id,
              frameworkId: rule.frameworkId,
              reference: rule.reference,
              title: rule.title,
              summary: rule.summary,
              controls: covered,
            },
          ];
    });
  }
}
