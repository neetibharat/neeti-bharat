import type { ProfileKey } from '../../profile.js';

/** The company answers each built-in policy quotes as a setting, so a change in the profile reaches the policy. */
export const POLICY_SETTINGS: Readonly<Record<string, readonly ProfileKey[]>> = {
  P01: ['languagesOffered', 'website', 'grievanceEmail'],
  P04: ['leaverAccessWithin', 'accessReview'],
  P05: ['minTls', 'encryptionStandard', 'keyRotation'],
  P06: ['logKeepPeriod'],
  P07: ['maxDataLoss', 'timeToRestore'],
  P08: ['breachReportWindow', 'breachContact'],
  P09: ['erasureWarning', 'logKeepPeriod', 'inactivityErasureAfter'],
  P10: ['grievanceEmail', 'dpoEmail'],
  P11: ['dpoName', 'dpoEmail', 'grievanceEmail', 'grievanceReplyTime'],
  P17: ['dpoName'],
};

export interface PolicyRequirement {
  title: string;
  description: string;
}

/** A policy's starting text. `{{key}}` marks a company answer that is filled in when the text is shown. */
export interface PolicyTemplate {
  purpose: string;
  scope: string;
  requirements: PolicyRequirement[];
  settings: readonly ProfileKey[];
  contact: string;
}

/** What a policy needs to build its text: its summary, which catalogue entry it came from, and its controls. */
export interface PolicySource {
  /** Empty for a policy the company added. */
  templateId: string | null;
  summary: string;
}

/** Builds the starting text from what the policy already says: its summary and the controls it covers. */
export function policyTemplate(
  policy: PolicySource,
  requirements: PolicyRequirement[],
): PolicyTemplate {
  return {
    purpose: policy.summary.replace(/the organisation/gi, '{{companyName}}'),
    scope:
      'All staff, contractors and systems at {{companyName}} that handle personal data held in {{hostingRegion}}.',
    requirements,
    settings: (policy.templateId && POLICY_SETTINGS[policy.templateId]) || [],
    contact: 'Questions go to {{dpoName}} at {{dpoEmail}}.',
  };
}
