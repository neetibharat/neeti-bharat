/**
 * The company profile: named facts about the company that policies, notices and reports reuse.
 *
 * Each answer has a stable `key`. Policies refer to the key, never to the label, so a label can be
 * reworded without breaking any document. Labels and hints live in the web app's messages under
 * `profile.fields.<key>`.
 */
/** `general` is the company's identity, edited on the General page. The rest are listed in Company profile. */
export const PROFILE_GROUPS = [
  'general',
  'setup',
  'company',
  'contacts',
  'legalLimits',
  'standards',
] as const;

export type ProfileGroup = (typeof PROFILE_GROUPS)[number];

/** What an answer must look like. `duration` is "<number> <unit>", so deadlines can be worked out from it. `yesNo` is "yes" or "no". */
export type ProfileKind = 'text' | 'url' | 'email' | 'duration' | 'yesNo';

export interface ProfileFieldDefinition {
  key: string;
  group: ProfileGroup;
  kind: ProfileKind;
  /** What the answer is until someone changes it. Empty means "not answered yet". */
  defaultValue: string;
}

export const PROFILE_FIELDS = [
  { key: 'companyName', group: 'general', kind: 'text', defaultValue: '' },
  { key: 'website', group: 'general', kind: 'url', defaultValue: '' },
  // The set-up answers decide which DPDP rules apply to the company.
  { key: 'handlesChildrenData', group: 'setup', kind: 'yesNo', defaultValue: 'no' },
  { key: 'sendsDataAbroad', group: 'setup', kind: 'yesNo', defaultValue: 'no' },
  { key: 'isSignificantFiduciary', group: 'setup', kind: 'yesNo', defaultValue: 'no' },
  { key: 'hostingRegion', group: 'company', kind: 'text', defaultValue: '' },
  { key: 'languagesOffered', group: 'company', kind: 'text', defaultValue: 'English' },
  { key: 'dpoName', group: 'contacts', kind: 'text', defaultValue: '' },
  { key: 'dpoEmail', group: 'contacts', kind: 'email', defaultValue: '' },
  { key: 'grievanceEmail', group: 'contacts', kind: 'email', defaultValue: '' },
  { key: 'breachContact', group: 'contacts', kind: 'text', defaultValue: '' },
  { key: 'breachReportWindow', group: 'legalLimits', kind: 'duration', defaultValue: '72 hours' },
  { key: 'grievanceReplyTime', group: 'legalLimits', kind: 'duration', defaultValue: '90 days' },
  { key: 'logKeepPeriod', group: 'legalLimits', kind: 'duration', defaultValue: '1 year' },
  { key: 'erasureWarning', group: 'legalLimits', kind: 'duration', defaultValue: '48 hours' },
  {
    key: 'inactivityErasureAfter',
    group: 'legalLimits',
    kind: 'duration',
    defaultValue: '3 years',
  },
  { key: 'leaverAccessWithin', group: 'standards', kind: 'duration', defaultValue: '24 hours' },
  { key: 'minTls', group: 'standards', kind: 'text', defaultValue: 'TLS 1.2' },
  { key: 'encryptionStandard', group: 'standards', kind: 'text', defaultValue: 'AES-256' },
  { key: 'keyRotation', group: 'standards', kind: 'text', defaultValue: 'every year' },
  { key: 'accessReview', group: 'standards', kind: 'text', defaultValue: 'every quarter' },
  { key: 'maxDataLoss', group: 'standards', kind: 'duration', defaultValue: '24 hours' },
  { key: 'timeToRestore', group: 'standards', kind: 'duration', defaultValue: '4 hours' },
] as const satisfies readonly ProfileFieldDefinition[];

export type ProfileKey = (typeof PROFILE_FIELDS)[number]['key'];

/** Keys of answers people add themselves start with this. */
export const CUSTOM_KEY_PREFIX = 'custom:';

export const PROFILE_VALUE_MAX_LENGTH = 500;
export const PROFILE_LABEL_MAX_LENGTH = 80;

/** Changing one of these needs a confirmation: they come from the Rules, not from the company. */
export function requiresConfirmation(group: ProfileGroup | 'custom'): boolean {
  return group === 'legalLimits';
}

/** A full link, such as https://company.in: the privacy notice points people to it. */
const WEB_ADDRESS = /^https?:\/\/[^\s/]+\.[^\s/]+(\/\S*)?$/i;

const DURATION = /^[1-9]\d{0,3} (hour|day|week|month|year)s?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether `value` is an acceptable answer for `kind`. An empty answer is allowed except for durations. */
export function isValidProfileValue(kind: ProfileKind, value: string): boolean {
  if (value.length > PROFILE_VALUE_MAX_LENGTH) return false;
  if (kind === 'duration') return DURATION.test(value);
  if (kind === 'yesNo') return value === 'yes' || value === 'no';
  if (value === '') return true;
  if (kind === 'email') return EMAIL.test(value);
  if (kind === 'url') return WEB_ADDRESS.test(value);
  return true;
}

export interface ProfileEntryResponse {
  key: string;
  group: ProfileGroup | 'custom';
  kind: ProfileKind;
  value: string;
  /** True until someone changes the answer. */
  isDefault: boolean;
  isCustom: boolean;
  /** Only for answers people added: what they called it. */
  label?: string;
  requiresConfirmation: boolean;
  /** True when the value comes from somewhere else, such as the DPO's details from the DPO role. It cannot be edited here. */
  isDerived?: boolean;
}

export interface ProfileResponse {
  entries: ProfileEntryResponse[];
}

export interface UpdateProfileEntryRequest {
  value: string;
  /** Needed to change a legal limit. */
  confirmed?: boolean;
}

export interface AddProfileEntryRequest {
  label: string;
  value: string;
}
