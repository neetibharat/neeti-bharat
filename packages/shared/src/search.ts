/** The kinds of record the global search finds. Each opens its own page. */
export const SEARCH_KINDS = [
  'policy',
  'proof',
  'vendor',
  'breach',
  'request',
  'person',
  'rule',
  'control',
] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export interface SearchHit {
  kind: SearchKind;
  id: string;
  title: string;
  /** A line under the title that tells like-named records apart. */
  detail?: string;
  /** The framework a rule or control sits in, to build its link. */
  frameworkId?: string;
  /** The rule a control sits under, to build its link. */
  ruleId?: string;
}

export interface SearchResponse {
  hits: SearchHit[];
}
