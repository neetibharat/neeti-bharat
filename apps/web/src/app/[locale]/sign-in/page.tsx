import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SignInForm } from '@/components/auth/sign-in-form';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';
import { Card } from '@/components/base/card/card';
import { redirect } from '@/i18n/navigation';
import { requireLocale } from '@/i18n/require-locale';
import { signInErrorCode } from '@/lib/sign-in-error';
import { getAuthProviders, getCurrentUser } from '@/lib/server-session';

interface SignInPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  if (await getCurrentUser()) return redirect({ href: '/', locale });
  const t = await getTranslations('auth.signIn');
  const tMeta = await getTranslations('meta');
  const [providers, { error }] = await Promise.all([getAuthProviders(), searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-10">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <span className="text-body font-semibold">{tMeta('title')}</span>
          </div>
          <h1 className="text-title font-semibold tracking-tight text-fg">{t('title')}</h1>
        </div>
        <SignInForm providers={providers} initialError={signInErrorCode(error)} />
      </Card>
    </main>
  );
}
