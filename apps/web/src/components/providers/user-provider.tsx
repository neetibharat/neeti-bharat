'use client';

import type { MeResponse } from '@dpdp-kit/shared';
import { createContext, useContext, type ReactNode } from 'react';
import { permissionsOf } from '@/lib/permissions';

const UserContext = createContext<MeResponse | null>(null);

/** Hands the signed-in person, read once by the layout, to every page below it. */
export function UserProvider({ user, children }: { user: MeResponse; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** The signed-in person, or null outside the app. */
export const useCurrentUser = (): MeResponse | null => useContext(UserContext);

/** What the signed-in person may do. Without a person, nothing. */
export function useCan(): { canEdit: boolean; isAdmin: boolean } {
  return permissionsOf(useCurrentUser());
}
