import type { AuthProvidersResponse, MeResponse } from '@dpdp-kit/shared';
import { headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@dpdp-kit/shared';
import { isAdminUser } from './permissions';

// Same default as next.config.ts: the address of the API from the web server's side.
const API_URL = process.env.API_URL ?? 'http://localhost:3201';

/** The signed-in person, or null. Server components only: it forwards the request's cookie to the API. */
export const getCurrentUser = cache(async (): Promise<MeResponse | null> => {
  const cookie = (await headers()).get('cookie');
  if (!cookie) return null;
  const response = await fetch(`${API_URL}/v1/me`, { headers: { cookie }, cache: 'no-store' });
  return response.ok ? ((await response.json()) as MeResponse) : null;
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
