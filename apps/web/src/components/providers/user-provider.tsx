'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { rememberOrganization, setActiveOrganizationId } from '@/lib/active-organization';
import type { SessionUser } from '@/lib/session-user';
import { permissionsOf } from '@/lib/permissions';

const UserContext = createContext<SessionUser | null>(null);

/** Hands the signed-in person, read once by the layout, to every page below it. */
export function UserProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  // Set while rendering, not in an effect, so the first requests of the page already say which organisation.
  setActiveOrganizationId(user.organization.id);
  useEffect(() => rememberOrganization(user.organization.id), [user.organization.id]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** The signed-in person, or null outside the app. */
export const useCurrentUser = (): SessionUser | null => useContext(UserContext);

/** What the signed-in person may do. Without a person, nothing. */
export function useCan(): { canEdit: boolean; isAdmin: boolean } {
  return permissionsOf(useCurrentUser());
}
