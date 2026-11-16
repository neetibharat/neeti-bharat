import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BrandPanel } from '@/components/auth/brand-panel';
import { SignInForm } from '@/components/auth/sign-in-form';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';
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
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <BrandPanel />
      <section className="flex items-center justify-center bg-surface px-6 py-12 sm:px-12">
        <div className="page-stagger w-full max-w-sm">
          <div>
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <BrandMark size="md" />
              <span className="text-subtitle font-semibold">{tMeta('title')}</span>
            </div>
            <h1 className="text-heading font-semibold tracking-tight text-fg">{t('title')}</h1>
            <p className="mt-2 mb-8 text-body text-fg-muted">{t('description')}</p>
          </div>
          <SignInForm providers={providers} initialError={signInErrorCode(error)} />
        </div>
      </section>
    </main>
  );
}
