import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { redirect } from '@/i18n/navigation';
import { requireLocale } from '@/i18n/require-locale';
import { getCurrentUser } from '@/lib/server-session';

interface SettingsLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/** Settings is for admins. Everyone else goes back to the dashboard. */
export default async function SettingsLayout({ children, params }: SettingsLayoutProps) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (user?.role !== 'admin') return redirect({ href: '/', locale });

  return children;
}
