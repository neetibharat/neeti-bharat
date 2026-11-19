import type { SearchKind } from '@dpdp-kit/shared';
import {
  IconAlertTriangle,
  IconBuildingStore,
  IconFileText,
  IconInbox,
  IconShieldCheck,
  IconUsers,
  type Icon,
} from '@tabler/icons-react';
import { NAV_AREAS, type NavItemId } from './navigation';

/** The page each kind of record opens on. */
export const SEARCH_HREFS: Record<SearchKind, (id: string) => string> = {
  policy: (id) => `/policies/${id}`,
  proof: (id) => `/proof/${id}`,
  vendor: (id) => `/vendors/${id}`,
  breach: (id) => `/breaches/${id}`,
  request: (id) => `/requests/${id}`,
  person: (id) => `/settings/people/${id}`,
};

/** The icon each kind of record carries, the same as its module in the sidebar. */
export const SEARCH_ICONS: Record<SearchKind, Icon> = {
  policy: IconFileText,
  proof: IconShieldCheck,
  vendor: IconBuildingStore,
  breach: IconAlertTriangle,
  request: IconInbox,
  person: IconUsers,
};

export interface PageTarget {
  id: NavItemId;
  href: string;
  icon: Icon;
}

/** Every page that is live and open to this person, once each. */
export function searchablePages(isAdmin: boolean): PageTarget[] {
  const seen = new Set<string>();
  return NAV_AREAS.filter((area) => !area.adminOnly || isAdmin)
    .flatMap((area) => area.sections.flatMap((section) => section.items))
    .filter((item) => item.status === 'live' && !seen.has(item.id) && seen.add(item.id))
    .map(({ id, href, icon }) => ({ id, href, icon }));
}

/** True when the key press is the shortcut that opens the search. */
export function isSearchShortcut(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>) {
  return event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
}
