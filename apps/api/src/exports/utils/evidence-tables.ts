import type { RuleResponse } from '@dpdp-kit/shared';
import type { Table } from './tables';
import { dayStamp } from './zip-names';

const words = (code: string): string => {
  const text = code.replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** The rule's controls, one row each, with how far each has got. */
export function controlsTable(rule: RuleResponse): Table {
  const header = [
    'Control id',
    'Control',
    'What it covers',
    'Status',
    'Owner',
    'Owner now',
    'Assigned to',
    'Review date',
    'Policies',
    'Policies approved',
    'Proof provided',
    'Pieces of proof',
  ];
  const rows = rule.controls.map((control) => [
    control.id,
    control.title,
    control.description,
    words(control.status),
    words(control.ownerRole),
    control.ownerName,
    control.assignee?.name,
    control.reviewDate,
    control.policies.map((policy) => `${policy.id} ${policy.title}`).join(' | '),
    `${control.policiesApproved} of ${control.policiesTotal}`,
    `${control.proofProvided} of ${control.proofRequired}`,
    control.evidenceCount,
  ]);
  return { header, rows };
}

/** What is in the pack, as the README lists it. */
const CONTENTS = [
  'In this pack:',
  '  controls.csv             the controls of this rule and how far each has got',
  '  proof-requirements.csv   what each control must prove, how often and when it is due',
  '  proof.csv                every piece of proof on these controls, with the file fingerprint',
  '  policies.csv             the policies that cover these controls',
  '  activity-log.csv         what was done to this rule, its controls and those policies',
  '  policies/                the newest approved text of each of those policies',
  '  proof/                   the files uploaded as proof, one folder per control',
  '  integrity.txt            the result of checking the whole activity log for changes',
  '',
  'activity-log.csv holds only the events about this rule. Each row keeps its own hash and the hash before it, so it can be matched against the full log in the audit pack.',
];

export interface EvidenceReadme {
  frameworkName: string;
  rule: RuleResponse;
  madeBy: string;
  now: Date;
  problems: string[];
}

/** The page an auditor or the Board reads first: what the rule asks, where it stands, and what is in the pack. */
export function evidenceReadme(input: EvidenceReadme): string {
  const { rule, problems } = input;
  const byStatus = new Map<string, number>();
  for (const control of rule.controls) {
    byStatus.set(control.status, (byStatus.get(control.status) ?? 0) + 1);
  }
  const standing = [...byStatus].map(
    ([status, count]) => `${count} ${words(status).toLowerCase()}`,
  );
  const lines = [
    `Evidence pack: ${rule.reference}, ${rule.title}`,
    `${input.frameworkName}. Made by ${input.madeBy} on ${dayStamp(input.now)}.`,
    '',
    'What the rule asks:',
    `  ${rule.summary}`,
    '',
    rule.applies
      ? 'This rule applies to the company.'
      : 'This rule does not apply to the company, going by its set-up answers.',
    `Controls: ${rule.controls.length}${standing.length ? ` (${standing.join(', ')})` : ''}.`,
    '',
    ...rule.controls.map(
      (control) =>
        `  - ${control.id} ${control.title}: ${words(control.status)}. Policies approved ${control.policiesApproved} of ${control.policiesTotal}. Proof ${control.proofProvided} of ${control.proofRequired}.`,
    ),
    '',
    ...CONTENTS,
  ];
  if (problems.length)
    lines.push('', 'Problems found while making this pack:', ...problems.map((p) => `  - ${p}`));
  return `${lines.join('\n')}\n`;
}
