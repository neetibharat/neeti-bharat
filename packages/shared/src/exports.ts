/** The tables that can be downloaded as CSV from `GET /v1/exports/csv/:dataset`. */
export const EXPORT_DATASETS = [
  'checklist',
  'proof_requirements',
  'evidence',
  'policies',
  'breaches',
  'requests',
  'people',
  'activity',
] as const;

export type ExportDataset = (typeof EXPORT_DATASETS)[number];

/**
 * The lists that can be cut to a range of days, and the date the range is read against. The other lists are always
 * whole, because they show how things stand today.
 */
export const EXPORT_DATED_DATASETS = {
  evidence: 'added',
  breaches: 'found',
  requests: 'received',
  activity: 'happened',
} as const satisfies Partial<Record<ExportDataset, string>>;

export type ExportDatedDataset = keyof typeof EXPORT_DATED_DATASETS;

export const isDatedDataset = (dataset: ExportDataset): dataset is ExportDatedDataset =>
  dataset in EXPORT_DATED_DATASETS;

/** How the activity log names a download (`DATA_EXPORTED`). The audit pack is the whole set in one zip. */
export const EXPORT_LOG_NAMES: Readonly<Record<ExportDataset | 'audit_pack', string>> = {
  audit_pack: 'the audit pack',
  checklist: 'the checklist',
  proof_requirements: 'the proof requirements',
  evidence: 'the proof list',
  policies: 'the policies',
  breaches: 'the breaches register',
  requests: 'the requests register',
  people: 'the people list',
  activity: 'the activity log',
};
