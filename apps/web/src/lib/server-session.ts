import type { AuthProvidersResponse, MeResponse } from '@dpdp-kit/shared';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@dpdp-kit/shared';
import { ORGANIZATION_COOKIE, resolveActiveOrganization } from './active-organization';
import { isAdminUser } from './permissions';
import { toSessionUser, type SessionUser } from './session-user';

// Same default as next.config.ts: the address of the API from the web server's side.
const API_URL = process.env.API_URL ?? 'http://localhost:3201';

/** The signed-in person and every organisation they can open, or null. Server components only: it forwards the request's cookie. */
export const getMe = cache(async (): Promise<MeResponse | null> => {
  const cookie = (await headers()).get('cookie');
  if (!cookie) return null;
  const response = await fetch(`${API_URL}/v1/me`, { headers: { cookie }, cache: 'no-store' });
  return response.ok ? ((await response.json()) as MeResponse) : null;
});

/**
 * The signed-in person in the organisation they are working in, which is the one they last picked if they still
 * belong to it. Null when nobody is signed in, and also when they belong to no organisation yet.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const me = await getMe();
  if (!me) return null;
  const remembered = (await cookies()).get(ORGANIZATION_COOKIE)?.value;
  const organization = resolveActiveOrganization(me.organizations, remembered);
  return organization ? toSessionUser(me, organization) : null;
});

/** Which of Google and Microsoft sign-in are switched on. Falls back to none if the API is unreachable. */
export async function getAuthProviders(): Promise<AuthProvidersResponse> {
  const none = { google: false, microsoft: false };
  try {
    const response = await fetch(`${API_URL}/v1/auth/providers`, { cache: 'no-store' });
    return response.ok ? ((await response.json()) as AuthProvidersResponse) : none;
  } catch {
    return none;
  }
}

/** For pages only an admin may open: anyone else is sent to the dashboard. Call it before rendering anything. */
export async function requireAdmin(locale: Locale): Promise<void> {
  if (!isAdminUser(await getCurrentUser())) redirect({ href: '/', locale });
}
