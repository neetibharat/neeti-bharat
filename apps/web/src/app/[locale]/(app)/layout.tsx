import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { UserProvider } from '@/components/providers/user-provider';
import { AppShell } from '@/components/shell/app-shell';
import { redirect } from '@/i18n/navigation';
import { requireLocale } from '@/i18n/require-locale';
import { getCurrentUser, getMe } from '@/lib/server-session';

interface AppLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/** Everything inside (app) needs a signed-in person in an organisation; anyone else goes to sign-in or to make one. */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  if (!(await getMe())) return redirect({ href: '/sign-in', locale });
  // Signed in but in no organisation yet: they make one, or wait for an invitation.
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/new-organization', locale });
  // A new organisation is set up first, by its admin.
  if (user.role === 'admin' && !user.organization.onboarded) {
    return redirect({ href: '/onboarding', locale });
  }

  return (
    <UserProvider user={user}>
      <AppShell user={user}>{children}</AppShell>
    </UserProvider>
  );
}
