import type { OrganizationSummary } from '@neeti-bharat/shared';

/** The cookie that remembers which organisation the person is working in, for the server and the browser alike. */
export const ORGANIZATION_COOKIE = 'app_org';

const YEAR_SECONDS = 365 * 24 * 60 * 60;

/** The organisation to work in: the one remembered, if they still belong to it, otherwise their first. */
export function resolveActiveOrganization(
  organizations: readonly OrganizationSummary[],
  remembered: string | null | undefined,
): OrganizationSummary | null {
  return organizations.find((org) => org.id === remembered) ?? organizations[0] ?? null;
}

// What the browser sends with every API call. Set once by the layout, before any page asks for data.
let activeId: string | null = null;

export function setActiveOrganizationId(id: string | null): void {
  activeId = id;
}

export function getActiveOrganizationId(): string | null {
  return activeId;
}

/** Remembers the choice in the browser, so the next visit and the server both know it. */
export function rememberOrganization(id: string): void {
  document.cookie = `${ORGANIZATION_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
}
