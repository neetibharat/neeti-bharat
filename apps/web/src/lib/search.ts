import type { SearchHit, SearchKind } from '@neeti-bharat/shared';
import {
  IconAlertTriangle,
  IconBuildingStore,
  IconChecklist,
  IconFileText,
  IconInbox,
  IconScale,
  IconShieldCheck,
  IconUserPlus,
  IconUsers,
  type Icon,
} from '@tabler/icons-react';
import { visibleAreas, type NavItemId } from './navigation';

/** The page a found record opens on. A rule and a control open the rule they sit under. */
const HREFS: Record<SearchKind, (hit: SearchHit) => string> = {
  policy: (hit) => `/policies/${hit.id}`,
  proof: (hit) => `/proof/${hit.id}`,
  vendor: (hit) => `/vendors/${hit.id}`,
  breach: (hit) => `/breaches/${hit.id}`,
  request: (hit) => `/requests/${hit.id}`,
  person: (hit) => `/settings/people/${hit.id}`,
  rule: (hit) => `/frameworks/${hit.frameworkId}/rules/${hit.id}`,
  control: (hit) => `/frameworks/${hit.frameworkId}/rules/${hit.ruleId}`,
};

export const searchHref = (hit: SearchHit): string => HREFS[hit.kind](hit);

/** The icon each kind of record carries, the same as its module in the sidebar. */
export const SEARCH_ICONS: Record<SearchKind, Icon> = {
  policy: IconFileText,
  proof: IconShieldCheck,
  vendor: IconBuildingStore,
  breach: IconAlertTriangle,
  request: IconInbox,
  person: IconUsers,
  rule: IconScale,
  control: IconChecklist,
};

export interface PageTarget {
  id: NavItemId;
  href: string;
  icon: Icon;
}

/** Every page that is live and open to this person, once each. */
export function searchablePages(isAdmin: boolean, aiOn = false): PageTarget[] {
  const seen = new Set<string>();
  return visibleAreas({ isAdmin, aiOn })
    .flatMap((area) => area.sections.flatMap((section) => section.items))
    .filter((item) => item.status === 'live' && !seen.has(item.id) && seen.add(item.id))
    .map(({ id, href, icon }) => ({ id, href, icon }));
}

export type QuickActionId = 'policy' | 'breach' | 'request' | 'vendor' | 'person';

export interface QuickAction {
  id: QuickActionId;
  /** The list page, opened with its add dialog showing. */
  href: string;
  icon: Icon;
  adminOnly?: boolean;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'policy', href: '/policies?new=1', icon: IconFileText },
  { id: 'breach', href: '/breaches?new=1', icon: IconAlertTriangle },
  { id: 'request', href: '/requests?new=1', icon: IconInbox },
  { id: 'vendor', href: '/vendors?new=1', icon: IconBuildingStore },
  { id: 'person', href: '/settings/people?new=1', icon: IconUserPlus, adminOnly: true },
];

/** The quick actions this person may use. An auditor only reads, so has none. */
export function quickActionsFor(canEdit: boolean, isAdmin: boolean): QuickAction[] {
  if (!canEdit) return [];
  return QUICK_ACTIONS.filter((action) => !action.adminOnly || isAdmin);
}

/** What the search remembers of a result opened before. The words and icon are worked out again from the key. */
export interface RecentSearch {
  key: string;
  href: string;
  title: string;
  detail?: string;
}

export const RECENT_KEY = 'app_recent_search';
export const RECENT_LIMIT = 5;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

const isRecent = (value: unknown): value is RecentSearch =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as RecentSearch).key === 'string' &&
  typeof (value as RecentSearch).href === 'string' &&
  typeof (value as RecentSearch).title === 'string';

/** The results opened lately, newest first. Anything unreadable is left out. */
export function loadRecent(store: Store | undefined): RecentSearch[] {
  try {
    const parsed: unknown = JSON.parse(store?.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isRecent).slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

/** Puts a result at the front of the list, once, and keeps the list short. */
export function rememberRecent(store: Store | undefined, item: RecentSearch): RecentSearch[] {
  const next = [item, ...loadRecent(store).filter((entry) => entry.key !== item.key)].slice(
    0,
    RECENT_LIMIT,
  );
  try {
    store?.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private windows can refuse to store; the search still works without a memory.
  }
  return next;
}

/** True when the key press is the shortcut that opens the search. */
export function isSearchShortcut(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>) {
  return event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
}
