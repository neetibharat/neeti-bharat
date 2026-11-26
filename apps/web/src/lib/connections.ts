import {
  AZURE_EDITABLE_FIELDS,
  AZURE_ID_PATTERN,
  type AzureEditableField,
  type ConnectionCheckResult,
  type UpdateConnectionRequest,
} from '@neeti-bharat/shared';

/**
 * Which sentence of a result to show. A pass has its own, anything else that was found is "problem" (a warning or a
 * failure, which the badge tells apart), and a check that could not answer says why.
 */
export function outcomeKey(result: ConnectionCheckResult): string {
  if (result.status === 'pass') return 'pass';
  if (result.status === 'skipped') return `skipped.${result.reason ?? 'error'}`;
  return 'problem';
}

/** `attention` shows only what failed or needs a look; `all` shows every check, passed and not checked too. */
export type ResultView = 'attention' | 'all';

const URGENCY: Record<ConnectionCheckResult['status'], number> = {
  fail: 0,
  warn: 1,
  pass: 2,
  skipped: 3,
};

export const needsAttention = (result: ConnectionCheckResult): boolean =>
  result.status === 'fail' || result.status === 'warn';

/** The results a view shows, failures first, then what needs a look, then the rest. Equal ones keep their order. */
export function inView(
  results: readonly ConnectionCheckResult[],
  view: ResultView,
): ConnectionCheckResult[] {
  const shown = view === 'all' ? [...results] : results.filter(needsAttention);
  return shown.sort((a, b) => URGENCY[a.status] - URGENCY[b.status]);
}

/** What the edit form holds: the name and the details that can be replaced. The secret starts empty and means "keep". */
export type EditValues = { name: string } & Record<AzureEditableField, string>;

/** The request that changes only what differs from `initial`, or null when nothing does. */
export function changesOf(initial: EditValues, values: EditValues): UpdateConnectionRequest | null {
  const credentials: Partial<Record<AzureEditableField, string>> = {};
  for (const field of AZURE_EDITABLE_FIELDS) {
    const value = values[field].trim();
    if (value !== '' && value !== initial[field]) credentials[field] = value;
  }
  const name = values.name.trim();
  const changed = name !== initial.name || Object.keys(credentials).length > 0;
  if (!changed) return null;
  return { name, ...(Object.keys(credentials).length > 0 && { credentials }) };
}

/** Whether the form can be sent: a name, and tenant and client ids of the shape Azure issues. */
export const canSaveEdit = (values: EditValues): boolean =>
  values.name.trim() !== '' &&
  AZURE_ID_PATTERN.test(values.tenantId.trim()) &&
  AZURE_ID_PATTERN.test(values.clientId.trim());
