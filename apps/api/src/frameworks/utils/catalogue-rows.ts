import {
  DPDP_CONTROLS,
  DPDP_FRAMEWORK,
  DPDP_FRAMEWORK_ID,
  DPDP_POLICIES,
  DPDP_RULES,
  ORGANISATION_GROUP,
  PROOF_REQUIREMENTS,
  type JobRole,
  type ProofFrequency,
  type RuleCondition,
} from '@dpdp-kit/shared';

export interface FrameworkSeed {
  id: string;
  name: string;
  about: string;
  seal: string;
  isBuiltIn: boolean;
  sortOrder: number;
}

export interface RequirementSeed {
  id: string;
  frameworkId: string;
  templateId: string;
  reference: string;
  title: string;
  summary: string;
  appliesWhen: RuleCondition;
  sortOrder: number;
}

export interface ControlSeed {
  id: string;
  frameworkId: string;
  templateId: string;
  requirementId: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface PolicySeed {
  id: string;
  frameworkId: string;
  templateId: string;
  title: string;
  summary: string;
  ownerRole: JobRole;
  approverTitle: string;
  reviewEvery: string;
  legalReferences: string[];
  sortOrder: number;
}

export interface LinkSeed {
  controlId: string;
  policyId: string;
  /** 0 is the control's primary policy. */
  position: number;
}

export interface ProofSeed {
  id: string;
  controlId: string;
  templateId: string;
  title: string;
  description: string;
  frequency: ProofFrequency;
  sortOrder: number;
}

export interface CatalogueRows {
  frameworks: FrameworkSeed[];
  requirements: RequirementSeed[];
  controls: ControlSeed[];
  policies: PolicySeed[];
  links: LinkSeed[];
  proofRequirements: ProofSeed[];
}

/** The ids already stored, so seeding adds only what is missing. */
export interface ExistingIds {
  frameworkIds: ReadonlySet<string>;
  requirementIds: ReadonlySet<string>;
  controlIds: ReadonlySet<string>;
  policyIds: ReadonlySet<string>;
  proofIds: ReadonlySet<string>;
}

const FRAMEWORK_ID = DPDP_FRAMEWORK_ID;

/** The DPDP catalogue as rows ready to be stored. Built-in rows keep their catalogue code as their id. */
export function dpdpRows(): CatalogueRows {
  return {
    frameworks: [{ ...DPDP_FRAMEWORK, isBuiltIn: true, sortOrder: 0 }],
    requirements: requirementRows(),
    controls: DPDP_CONTROLS.map((control, index) => ({
      id: control.id,
      frameworkId: FRAMEWORK_ID,
      templateId: control.id,
      requirementId: control.ruleId,
      title: control.title,
      description: control.description,
      sortOrder: index,
    })),
    policies: DPDP_POLICIES.map((policy, index) => ({
      id: policy.id,
      frameworkId: FRAMEWORK_ID,
      templateId: policy.id,
      title: policy.title,
      summary: policy.summary,
      ownerRole: policy.ownerRole,
      approverTitle: policy.approver,
      reviewEvery: policy.reviewEvery,
      legalReferences: [...policy.legalReferences],
      sortOrder: index,
    })),
    links: DPDP_CONTROLS.flatMap((control) =>
      control.policyIds.map((policyId, position) => ({
        controlId: control.id,
        policyId,
        position,
      })),
    ),
    proofRequirements: proofRows(),
  };
}

/** The rules in the order the law lists them, then the group for organisation-wide controls. */
function requirementRows(): RequirementSeed[] {
  return [...DPDP_RULES, ORGANISATION_GROUP].map((rule, index) => ({
    id: rule.id,
    frameworkId: FRAMEWORK_ID,
    templateId: rule.id,
    reference: rule.reference,
    title: rule.title,
    summary: rule.summary,
    appliesWhen: rule.appliesWhen,
    sortOrder: index,
  }));
}

function proofRows(): ProofSeed[] {
  return PROOF_REQUIREMENTS.map((requirement, index) => ({
    id: requirement.id,
    controlId: requirement.controlId,
    templateId: requirement.id,
    title: requirement.title,
    description: requirement.description ?? '',
    frequency: requirement.frequency,
    sortOrder: index,
  }));
}

/**
 * What still has to be stored. Rows already there are left alone, so a company's edits are never overwritten.
 * A link is added only when one of its two ends is new, so a link the company removed does not come back.
 */
export function planSeed(rows: CatalogueRows, existing: ExistingIds): CatalogueRows {
  const frameworks = rows.frameworks.filter((row) => !existing.frameworkIds.has(row.id));
  const requirements = rows.requirements.filter((row) => !existing.requirementIds.has(row.id));
  const controls = rows.controls.filter((row) => !existing.controlIds.has(row.id));
  const policies = rows.policies.filter((row) => !existing.policyIds.has(row.id));
  const newControls = new Set(controls.map((row) => row.id));
  const newPolicies = new Set(policies.map((row) => row.id));
  const links = rows.links.filter(
    (link) => newControls.has(link.controlId) || newPolicies.has(link.policyId),
  );
  const proofRequirements = rows.proofRequirements.filter((row) => !existing.proofIds.has(row.id));
  return { frameworks, requirements, controls, policies, links, proofRequirements };
}
