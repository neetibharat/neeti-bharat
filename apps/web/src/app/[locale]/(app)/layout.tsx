import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { UserProvider } from '@/components/providers/user-provider';
import { AppShell } from '@/components/shell/app-shell';
import { redirect } from '@/i18n/navigation';
import { requireLocale } from '@/i18n/require-locale';
import { getCurrentUser } from '@/lib/server-session';

interface AppLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/** Everything inside (app) needs a signed-in person; anyone else goes to sign-in. */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/sign-in', locale });

  return (
    <UserProvider user={user}>
      <AppShell user={user}>{children}</AppShell>
    </UserProvider>
  );
}
