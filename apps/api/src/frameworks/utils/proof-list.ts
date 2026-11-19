import type {
  ProofByControlResponse,
  ProofControlGroup,
  ProofCounts,
  ProofItemResponse,
  ProofOverviewResponse,
  ProofStatus,
  ProofTab,
} from '@dpdp-kit/shared';

/** What the proof list can be narrowed by. Every part is optional except the page. */
export interface ProofListQuery {
  tab: ProofTab;
  q?: string;
  assigneeId?: string;
  ruleId?: string;
  controlId?: string;
  page: number;
  limit: number;
}

const ORDER: Record<ProofStatus, number> = { missing: 0, due: 1, provided: 2 };

/** What is overdue first, then what is outstanding, then what is out of date, then what is in. */
const byUrgency = (a: ProofItemResponse, b: ProofItemResponse): number =>
  Number(b.overdue) - Number(a.overdue) ||
  ORDER[a.status] - ORDER[b.status] ||
  a.controlTitle.localeCompare(b.controlTitle) ||
  a.title.localeCompare(b.title);

const mentions = (item: ProofItemResponse, needle: string): boolean =>
  item.title.toLowerCase().includes(needle) || item.controlTitle.toLowerCase().includes(needle);

/** Each narrowing the person can ask for. One that was not asked for lets everything through. */
const NARROWINGS: ((item: ProofItemResponse, query: ProofListQuery) => boolean)[] = [
  (item, { controlId }) => !controlId || item.controlId === controlId,
  (item, { assigneeId }) => !assigneeId || item.assigneeId === assigneeId,
  (item, { ruleId }) => !ruleId || item.ruleId === ruleId,
  (item, { q }) => !q?.trim() || mentions(item, q.trim().toLowerCase()),
];

const matches = (item: ProofItemResponse, query: ProofListQuery): boolean =>
  NARROWINGS.every((narrows) => narrows(item, query));

const inTab = (item: ProofItemResponse, tab: ProofTab): boolean =>
  tab === 'all' || (tab === 'overdue' ? item.overdue : item.status === tab);

function countsOf(items: ProofItemResponse[]): ProofCounts {
  return {
    all: items.length,
    overdue: items.filter((item) => item.overdue).length,
    missing: items.filter((item) => item.status === 'missing').length,
    due: items.filter((item) => item.status === 'due').length,
    provided: items.filter((item) => item.status === 'provided').length,
  };
}

/**
 * One page of the proof list. Search and filters narrow it, the counts say what each tab would hold for that
 * narrowing, and the chosen tab and page cut what is sent.
 */
export function proofList(
  all: ProofItemResponse[],
  query: ProofListQuery,
  control: ProofOverviewResponse['control'],
): ProofOverviewResponse {
  const scope = all.filter((item) => matches(item, query));
  const shown = scope.filter((item) => inTab(item, query.tab)).sort(byUrgency);
  const start = (query.page - 1) * query.limit;
  const inControl = all.filter((item) => !query.controlId || item.controlId === query.controlId);
  return {
    items: shown.slice(start, start + query.limit),
    total: shown.length,
    page: query.page,
    pageSize: query.limit,
    counts: countsOf(scope),
    rules: [...new Set(inControl.map((item) => item.ruleId))],
    control,
  };
}

const TABS: ProofTab[] = ['all', 'overdue', 'missing', 'due', 'provided'];

/** One control's requirements under the current narrowing, with the ones the open tab shows. */
function groupOf(items: ProofItemResponse[], tab: ProofTab): ProofControlGroup {
  const first = items[0]!;
  return {
    controlId: first.controlId,
    controlTitle: first.controlTitle,
    ruleId: first.ruleId,
    ownerRole: first.ownerRole,
    ownerName: first.ownerName,
    counts: countsOf(items),
    items: items.filter((item) => inTab(item, tab)).sort(byUrgency),
  };
}

/** How many controls each tab would hold: a control is in a tab when any of its requirements is. */
function controlCountsOf(groups: ProofControlGroup[]): ProofCounts {
  const counts = Object.fromEntries(
    TABS.map((tab) => [tab, groups.filter((group) => group.counts[tab] > 0).length]),
  );
  return counts as ProofCounts;
}

/**
 * One page of controls with their proof. Search and filters narrow the requirements, the counts say what each tab
 * would hold, and the chosen tab and page cut which controls are sent. Controls keep the order they came in.
 */
export function proofByControl(
  all: ProofItemResponse[],
  query: ProofListQuery,
): ProofByControlResponse {
  const scope = all.filter((item) => matches(item, query));
  const byControl = new Map<string, ProofItemResponse[]>();
  for (const item of scope)
    byControl.set(item.controlId, [...(byControl.get(item.controlId) ?? []), item]);
  const groups = [...byControl.values()].map((items) => groupOf(items, query.tab));
  const shown = groups.filter((group) => group.items.length > 0);
  const start = (query.page - 1) * query.limit;
  return {
    groups: shown.slice(start, start + query.limit),
    total: shown.length,
    page: query.page,
    pageSize: query.limit,
    counts: countsOf(scope),
    controlCounts: controlCountsOf(groups),
    rules: [...new Set(all.map((item) => item.ruleId))],
  };
}
