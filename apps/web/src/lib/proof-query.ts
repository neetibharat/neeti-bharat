import { PROOF_PAGE_SIZE, type ProofTab } from '@neeti-bharat/shared';
import { ALL } from './filters';

/** What the person has typed or picked above the proof list. `ALL` means no limit; an empty search matches everything. */
export interface ProofFilters {
  search: string;
  assigneeId: string;
  ruleId: string;
}

export const NO_FILTERS: ProofFilters = { search: '', assigneeId: ALL, ruleId: ALL };

/** What `GET /v1/proof` is asked: only what is set is sent, so the address stays short. */
export interface ProofQuery {
  tab?: ProofTab;
  q?: string;
  assigneeId?: string;
  ruleId?: string;
  controlId?: string;
  policyId?: string;
  page?: number;
  limit?: number;
}

interface Scope {
  filters: ProofFilters;
  tab: ProofTab;
  page: number;
  controlId?: string;
}

/** The request for one page of the list, from the filters, the open tab and the page. */
export function toProofQuery({ filters, tab, page, controlId }: Scope): ProofQuery {
  const search = filters.search.trim();
  return {
    tab,
    q: search || undefined,
    assigneeId: filters.assigneeId === ALL ? undefined : filters.assigneeId,
    ruleId: filters.ruleId === ALL ? undefined : filters.ruleId,
    controlId,
    page,
    limit: PROOF_PAGE_SIZE,
  };
}
