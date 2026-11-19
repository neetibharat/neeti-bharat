/** The kinds of record the global search finds. Each opens its own page. */
export const SEARCH_KINDS = ['policy', 'proof', 'vendor', 'breach', 'request', 'person'] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export interface SearchHit {
  kind: SearchKind;
  id: string;
  title: string;
  /** A line under the title that tells like-named records apart. */
  detail?: string;
}

export interface SearchResponse {
  hits: SearchHit[];
}
