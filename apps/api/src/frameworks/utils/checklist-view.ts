import {
  ORGANISATION_RULE_ID,
  computeControlStatus,
  proofDue,
  proofStatus,
  ruleApplies,
  type ProofFrequency,
  type ProofItemResponse,
  type ProofTally,
  type PolicyStatus,
  type ControlResponse,
  type JobRole,
  type RuleCondition,
  type RuleResponse,
  type SetupAnswers,
} from '@neeti-bharat/shared';
import { day, iso, lastProvided } from './dates';

/** A control as stored, with the policies that cover it, primary first. */
export interface ControlRow {
  id: string;
  frameworkId: string;
  requirementId: string;
  title: string;
  description: string;
  ownerRole: JobRole | null;
  /** Empty for a control the company added. */
  templateId: string | null;
  assignee: { id: string; name: string } | null;
  reviewDate: Date | null;
  policies: { policyId: string }[];
  _count: { evidence: number };
  proofRequirements: ProofRequirementRow[];
}

/** A thing a control needs proof of, with when proof was last given. */
export interface ProofRequirementRow {
  id: string;
  title: string;
  frequency: ProofFrequency;
  dueDate: Date | null;
  assignee: { id: string; name: string } | null;
  evidence: { createdAt: Date }[];
}

/** The little a control needs to know about a policy that covers it. */
export interface PolicyBrief {
  id: string;
  title: string;
  ownerRole: JobRole;
  status: PolicyStatus;
}

export type PolicyBriefs = ReadonlyMap<string, PolicyBrief>;

/** The name of whoever holds each job. A job with no holder has no entry. */
export type RoleHolders = Partial<Record<JobRole, string>>;

/** Who owns a control until someone picks another: its primary policy's owner. Organisation-wide ones go to the DPO. */
export function defaultOwnerFor(control: ControlRow, policies: PolicyBriefs): JobRole {
  if (control.requirementId === ORGANISATION_RULE_ID) return 'DPO';
  const primary = control.policies[0] && policies.get(control.policies[0].policyId);
  return primary ? primary.ownerRole : 'DPO';
}

/** How much proof a control needs, how much of that is in and still good, and how much is attached. */
export function tallyProof(control: ControlRow, now: Date): ProofTally {
  const provided = control.proofRequirements.filter(
    (requirement) =>
      proofStatus(lastProvided(requirement.evidence), requirement.frequency, now) === 'provided',
  );
  return {
    required: control.proofRequirements.length,
    provided: provided.length,
    attached: control._count.evidence,
  };
}

/** One control as the checklist shows it. */
export function controlView(
  control: ControlRow,
  policies: PolicyBriefs,
  holders: RoleHolders,
  now: Date = new Date(),
): ControlResponse {
  const proof = tallyProof(control, now);
  const chosen = control.ownerRole;
  const linked = control.policies.flatMap((link) => policies.get(link.policyId) ?? []);
  const ownerRole = chosen ?? defaultOwnerFor(control, policies);
  return {
    id: control.id,
    frameworkId: control.frameworkId,
    title: control.title,
    description: control.description,
    policies: control.policies.flatMap((link) => {
      const policy = policies.get(link.policyId);
      return policy ? [{ id: policy.id, title: policy.title }] : [];
    }),
    status: computeControlStatus(
      linked.map((policy) => policy.status),
      proof,
    ),
    policiesApproved: linked.filter((policy) => policy.status === 'approved').length,
    policiesTotal: linked.length,
    ownerRole,
    ownerIsDefault: chosen === null,
    ownerName: holders[ownerRole] ?? null,
    requirementId: control.requirementId,
    isCustom: control.templateId === null,
    assignee: control.assignee,
    reviewDate: day(control.reviewDate),
    evidenceCount: proof.attached,
    proofRequired: proof.required,
    proofProvided: proof.provided,
  };
}

/** One rule as stored: what it is called and what switches it on. */
export interface RequirementRow {
  id: string;
  frameworkId: string;
  /** Empty for a rule the company added. */
  templateId: string | null;
  reference: string;
  title: string;
  summary: string;
  appliesWhen: RuleCondition;
}

/** Every rule in order, then the organisation-wide group, each with its controls. */
export function buildChecklist(
  requirements: RequirementRow[],
  controls: ControlRow[],
  policies: PolicyBriefs,
  holders: RoleHolders,
  answers: SetupAnswers,
): RuleResponse[] {
  return requirements.map((rule) => {
    const shown = controls
      .filter((control) => control.requirementId === rule.id)
      .map((control) => controlView(control, policies, holders));
    const applies = ruleApplies(rule.appliesWhen, answers);
    return {
      id: rule.id,
      frameworkId: rule.frameworkId,
      reference: rule.reference,
      title: rule.title,
      summary: rule.summary,
      appliesWhen: rule.appliesWhen,
      isCustom: rule.templateId === null,
      applies,
      controls: shown,
    };
  });
}

/** One requirement as the Proof page lists it. */
function proofItem(
  requirement: ProofRequirementRow,
  control: ControlRow,
  owner: ControlResponse,
  now: Date,
): ProofItemResponse {
  const last = lastProvided(requirement.evidence);
  const due = proofDue(last, requirement.frequency, requirement.dueDate, now);
  return {
    id: requirement.id,
    title: requirement.title,
    frequency: requirement.frequency,
    status: proofStatus(last, requirement.frequency, now),
    assigneeId: requirement.assignee ? requirement.assignee.id : null,
    assigneeName: requirement.assignee ? requirement.assignee.name : null,
    dueOn: iso(due.dueOn),
    overdue: due.overdue,
    controlId: control.id,
    controlTitle: control.title,
    ruleId: control.requirementId,
    ownerRole: owner.ownerRole,
    ownerName: owner.ownerName,
  };
}

/** Everything that needs proof, across the controls that have not been archived. */
export function proofItems(
  controls: ControlRow[],
  policies: PolicyBriefs,
  holders: RoleHolders,
  now: Date = new Date(),
): ProofItemResponse[] {
  return controls.flatMap((control) => {
    const owner = controlView(control, policies, holders, now);
    return control.proofRequirements.map((requirement) =>
      proofItem(requirement, control, owner, now),
    );
  });
}
