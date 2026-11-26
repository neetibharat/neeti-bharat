import {
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconBuildingStore,
  IconSchool,
  IconBell,
  IconBuilding,
  IconCalendarDue,
  IconChecklist,
  IconDatabase,
  IconDownload,
  IconFileText,
  IconGauge,
  IconHistory,
  IconInbox,
  IconKey,
  IconLayoutDashboard,
  IconLock,
  IconCloudCheck,
  IconPlugConnected,
  IconScale,
  IconSettings,
  IconShieldCheck,
  IconShieldLock,
  IconSparkles,
  IconUsers,
  IconWorldSearch,
  type Icon,
} from '@tabler/icons-react';

/**
 * The whole product map, in one place. The slim sidebar is drawn from it: a rail with one icon
 * per area, and a panel listing the pages of the selected area.
 *
 * To ship a module, build its page and flip its `status` to 'live'.
 * Labels live in messages/en.json under nav.areas, nav.sections and nav.items, with the same ids.
 */
export type NavStatus = 'live' | 'soon';

export type AreaId = 'workspace' | 'data' | 'privacy' | 'settings';

export type SectionId = 'alerts' | 'developers' | 'records' | 'checks' | 'compliance';

export type NavItemId =
  | 'dashboard'
  | 'myWork'
  | 'deadlines'
  | 'frameworks'
  | 'readiness'
  | 'policies'
  | 'proof'
  | 'exports'
  | 'connections'
  | 'cloudTests'
  | 'websiteCheck'
  | 'requests'
  | 'breaches'
  | 'vendors'
  | 'training'
  | 'general'
  | 'companyProfile'
  | 'people'
  | 'notifications'
  | 'apiKeys'
  | 'secrets'
  | 'activityLog'
  | 'aiHelp';

export interface NavItem {
  id: NavItemId;
  href: string;
  icon: Icon;
  status: NavStatus;
}

/** A run of pages in a panel. Only some sections have a heading. */
export interface NavSection {
  id?: SectionId;
  items: NavItem[];
}

export interface NavArea {
  id: AreaId;
  icon: Icon;
  sections: NavSection[];
  /** Admins only, and pinned to the bottom of the rail. */
  adminOnly?: boolean;
}

export const NAV_AREAS: NavArea[] = [
  {
    id: 'workspace',
    icon: IconLayoutDashboard,
    sections: [
      {
        items: [
          { id: 'dashboard', href: '/', icon: IconLayoutDashboard, status: 'live' },
          { id: 'myWork', href: '/my-work', icon: IconChecklist, status: 'live' },
          { id: 'deadlines', href: '/deadlines', icon: IconCalendarDue, status: 'live' },
        ],
      },
      {
        id: 'compliance',
        items: [
          { id: 'frameworks', href: '/frameworks', icon: IconScale, status: 'live' },
          { id: 'readiness', href: '/readiness', icon: IconGauge, status: 'live' },
          { id: 'policies', href: '/policies', icon: IconFileText, status: 'live' },
          { id: 'proof', href: '/proof', icon: IconShieldCheck, status: 'live' },
          { id: 'exports', href: '/exports', icon: IconDownload, status: 'live' },
        ],
      },
    ],
  },
  {
    id: 'data',
    icon: IconDatabase,
    sections: [
      {
        items: [
          { id: 'connections', href: '/connections', icon: IconPlugConnected, status: 'live' },
        ],
      },
      {
        id: 'checks',
        items: [
          { id: 'cloudTests', href: '/cloud-tests', icon: IconCloudCheck, status: 'live' },
          { id: 'websiteCheck', href: '/website-check', icon: IconWorldSearch, status: 'live' },
        ],
      },
    ],
  },
  {
    id: 'privacy',
    icon: IconShieldLock,
    sections: [
      {
        items: [
          { id: 'requests', href: '/requests', icon: IconInbox, status: 'live' },
          { id: 'breaches', href: '/breaches', icon: IconAlertTriangle, status: 'live' },
          { id: 'vendors', href: '/vendors', icon: IconBuildingStore, status: 'live' },
          { id: 'training', href: '/training', icon: IconSchool, status: 'live' },
        ],
      },
    ],
  },
  {
    id: 'settings',
    icon: IconSettings,
    adminOnly: true,
    sections: [
      {
        items: [
          {
            id: 'general',
            href: '/settings/general',
            icon: IconAdjustmentsHorizontal,
            status: 'live',
          },
          {
            id: 'companyProfile',
            href: '/settings/company-profile',
            icon: IconBuilding,
            status: 'live',
          },
          { id: 'people', href: '/settings/people', icon: IconUsers, status: 'live' },
        ],
      },
      {
        id: 'alerts',
        items: [
          { id: 'notifications', href: '/settings/notifications', icon: IconBell, status: 'live' },
        ],
      },
      {
        id: 'developers',
        items: [
          { id: 'apiKeys', href: '/settings/api-keys', icon: IconKey, status: 'live' },
          { id: 'aiHelp', href: '/settings/ai', icon: IconSparkles, status: 'live' },
          { id: 'secrets', href: '/settings/secrets', icon: IconLock, status: 'soon' },
        ],
      },
      {
        id: 'records',
        items: [
          { id: 'activityLog', href: '/settings/activity-log', icon: IconHistory, status: 'live' },
        ],
      },
    ],
  },
];

/** What this install has, so a page that needs something it lacks is left out. */
export interface NavFeatures {
  isAdmin: boolean;
  /** The install has an AI service set up. */
  aiOn: boolean;
}

/** The areas this person sees: admin areas only for admins, and no AI help page where there is no AI service. */
export function visibleAreas({ isAdmin, aiOn }: NavFeatures): NavArea[] {
  return NAV_AREAS.filter((area) => !area.adminOnly || isAdmin).map((area) => ({
    ...area,
    sections: area.sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.id !== 'aiHelp' || aiOn),
    })),
  }));
}

export function itemsOf(area: NavArea): NavItem[] {
  return area.sections.flatMap((section) => section.items);
}

/** A page is lit for its own address and everything beneath it. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The area a page belongs to. Anything unknown counts as the workspace. */
export function areaForPath(pathname: string): NavArea {
  const owner = NAV_AREAS.find((area) =>
    itemsOf(area).some((item) => isActivePath(pathname, item.href)),
  );
  return owner ?? NAV_AREAS[0]!;
}

/** The first page of an area that exists, where an area's own address sends you. */
export function firstLiveHref(areaId: AreaId): string {
  const area = NAV_AREAS.find((candidate) => candidate.id === areaId);
  const live = area ? itemsOf(area).find((item) => item.status === 'live') : undefined;
  return live?.href ?? '/';
}
