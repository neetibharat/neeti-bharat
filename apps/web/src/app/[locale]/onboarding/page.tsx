import { setRequestLocale } from 'next-intl/server';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { UserProvider } from '@/components/providers/user-provider';
import { redirect } from '@/i18n/navigation';
import { requireLocale } from '@/i18n/require-locale';
import { getCurrentUser } from '@/lib/server-session';

/** The set-up that follows creating an organisation. Only its admin sees it, and only until it is over. */
export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/sign-in', locale });
  if (user.role !== 'admin' || user.organization.onboarded) return redirect({ href: '/', locale });

  return (
    <UserProvider user={user}>
      <OnboardingFlow />
    </UserProvider>
  );
}
