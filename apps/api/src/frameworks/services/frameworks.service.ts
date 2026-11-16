import { HttpStatus, Injectable } from '@nestjs/common';
import {
  JOB_ROLES,
  type ChecklistResponse,
  type ControlResponse,
  type FrameworkListResponse,
  type PolicyCoverageResponse,
  type ProofItemResponse,
  type RulePageResponse,
  type RuleResponse,
} from '@dpdp-kit/shared';
import { activeOrNotFound } from '../../core/common/active';
import { AppException } from '../../core/common/app.exception';
import { RuleReader } from './rule-reader';
import { RoleHolderReader } from '../../people/services/role-holder-reader';
import { ControlRepository } from '../repositories/control.repository';
import { PolicyRepository } from '../repositories/policy.repository';
import {
  buildChecklist,
  controlView,
  proofItems,
  type PolicyBriefs,
  type RoleHolders,
} from '../utils/checklist-view';
import { coverageOf, frameworkView, summaryOf } from '../utils/framework-view';
import { policyView } from '../utils/policy-view';

@Injectable()
export class FrameworksService {
  constructor(
    private readonly controls: ControlRepository,
    private readonly policies: PolicyRepository,
    private readonly holders: RoleHolderReader,
    private readonly rules: RuleReader,
  ) {}

  /** Refuses a rule that does not exist or has been archived. */
  assertRule(id: string): Promise<{ frameworkId: string }> {
    return this.rules.assertActive(id);
  }

  /** One framework: its rules with their controls, and its archived controls. */
  async checklist(frameworkId: string): Promise<ChecklistResponse> {
    const framework = await this.rules.framework(frameworkId);
    const rules = await this.rulesOf(framework.id);
    const ids = new Set(rules.map((rule) => rule.id));
    const archived = (await this.controls.findArchived()).filter((c) => ids.has(c.requirementId));
    return { framework: frameworkView(framework), rules, archived };
  }

  /** One rule with its controls, and the policies that cover them. A rule of another framework, or an archived one, is not found. */
  async rulePage(frameworkId: string, ruleId: string): Promise<RulePageResponse> {
    const framework = await this.rules.framework(frameworkId);
    const [{ requirements, answers }, controls, policies, holders] = await Promise.all([
      this.rules.forChecklist(framework.id),
      this.controls.findActive(),
      this.policies.findActive(),
      this.roleHolders(),
    ]);
    const row = requirements.find((requirement) => requirement.id === ruleId);
    if (!row) throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    const briefs: PolicyBriefs = new Map(policies.map((policy) => [policy.id, policy]));
    const [rule] = buildChecklist([row], controls, briefs, holders, answers) as [RuleResponse];
    const covering = new Set(rule.controls.flatMap((c) => c.policies.map((policy) => policy.id)));
    return { rule, policies: policies.filter((policy) => covering.has(policy.id)).map(policyView) };
  }

  /** Every framework the company follows, with how far along each is. */
  async list(): Promise<FrameworkListResponse> {
    const [{ frameworks, requirements, answers }, controls, briefs, holders] = await Promise.all([
      this.rules.everything(),
      this.controls.findActive(),
      this.policyBriefs(),
      this.roleHolders(),
    ]);
    return {
      frameworks: frameworks.map((row) => {
        const own = requirements.filter((rule) => rule.frameworkId === row.id);
        return summaryOf(row, buildChecklist(own, controls, briefs, holders, answers));
      }),
    };
  }

  /** Every control a policy covers, across all frameworks, each with the rule and framework it sits under. */
  async policyCoverage(policyId: string): Promise<PolicyCoverageResponse> {
    const [{ frameworks, requirements }, controls, briefs, holders] = await Promise.all([
      this.rules.everything(),
      this.controls.findActive(),
      this.policyBriefs(),
      this.roleHolders(),
    ]);
    return { items: coverageOf(policyId, { frameworks, requirements, controls, briefs, holders }) };
  }

  private async rulesOf(frameworkId: string): Promise<RuleResponse[]> {
    const [{ requirements, answers }, controls, briefs, holders] = await Promise.all([
      this.rules.forChecklist(frameworkId),
      this.controls.findActive(),
      this.policyBriefs(),
      this.roleHolders(),
    ]);
    return buildChecklist(requirements, controls, briefs, holders, answers);
  }

  /** Every proof requirement, with its control and where it stands. */
  async proofItems(): Promise<ProofItemResponse[]> {
    const [controls, briefs, holders] = await Promise.all([
      this.controls.findActive(),
      this.policyBriefs(),
      this.roleHolders(),
    ]);
    return proofItems(controls, briefs, holders);
  }

  /** One control as the checklist shows it. */
  async control(controlId: string): Promise<ControlResponse> {
    const [found, briefs, holders] = await Promise.all([
      this.controls.findOne(controlId),
      this.policyBriefs(),
      this.roleHolders(),
    ]);
    return controlView(activeOrNotFound(found), briefs, holders);
  }

  private async policyBriefs(): Promise<PolicyBriefs> {
    const policies = await this.policies.findActive();
    return new Map(policies.map((policy) => [policy.id, policy]));
  }

  private async roleHolders(): Promise<RoleHolders> {
    const found = await Promise.all(
      JOB_ROLES.map(async (role) => [role, (await this.holders.holderOf(role))?.name] as const),
    );
    return Object.fromEntries(found.filter(([, name]) => name !== undefined));
  }
}
