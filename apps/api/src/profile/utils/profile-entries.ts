import {
  CUSTOM_KEY_PREFIX,
  PROFILE_FIELDS,
  requiresConfirmation,
  type ProfileEntryResponse,
  type ProfileFieldDefinition,
  type ProfileGroup,
  type ProfileKind,
} from '@neeti-bharat/shared';
import type { ProfileEntry } from '../../generated/prisma/client';

/** One answer as the rest of the service sees it, built-in or added by a person. */
export interface ProfileTarget {
  key: string;
  group: ProfileGroup | 'custom';
  kind: ProfileKind;
  current: string;
  /** Only for answers people added. */
  label?: string;
}

export function builtInEntry(
  definition: ProfileFieldDefinition,
  row?: ProfileEntry,
): ProfileEntryResponse {
  return {
    key: definition.key,
    group: definition.group,
    kind: definition.kind,
    value: row?.value ?? definition.defaultValue,
    isDefault: !row,
    isCustom: false,
    requiresConfirmation: requiresConfirmation(definition.group),
  };
}

export function customEntry(row: ProfileEntry): ProfileEntryResponse {
  return {
    key: row.key,
    group: 'custom',
    kind: 'text',
    value: row.value,
    isDefault: false,
    isCustom: true,
    label: row.label ?? row.key,
    requiresConfirmation: false,
  };
}

/** Finds the answer a key refers to, or null if there is no such answer. */
export function resolveTarget(key: string, row: ProfileEntry | null): ProfileTarget | null {
  if (key.startsWith(CUSTOM_KEY_PREFIX)) {
    if (!row?.isCustom) return null;
    return { key, group: 'custom', kind: 'text', current: row.value, label: row.label ?? key };
  }
  const definition = PROFILE_FIELDS.find((field) => field.key === key);
  if (!definition) return null;
  return {
    key,
    group: definition.group,
    kind: definition.kind,
    current: row?.value ?? definition.defaultValue,
  };
}

/** Answers that come from whoever holds the DPO role, so they can never disagree with it. */
export const DPO_DERIVED_KEYS: readonly string[] = ['dpoName', 'dpoEmail'];

/** While a DPO is assigned, their name and email stand in for the two DPO answers. */
export function overlayDpo(
  entries: ProfileEntryResponse[],
  dpo: { name: string; email: string } | null,
): ProfileEntryResponse[] {
  if (!dpo) return entries;
  const fromRole: Record<string, string> = { dpoName: dpo.name, dpoEmail: dpo.email };
  return entries.map((entry) =>
    entry.key in fromRole
      ? { ...entry, value: fromRole[entry.key]!, isDefault: false, isDerived: true }
      : entry,
  );
}

/** A readable key for an answer someone named, such as "custom:office-address". */
export function customKeyFor(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug ? `${CUSTOM_KEY_PREFIX}${slug}` : '';
}
