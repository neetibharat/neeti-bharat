import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';
import { Card } from '@/components/base/card/card';
import { CreateOrganizationForm } from '@/components/organizations/create-organization-form';
import { redirect } from '@/i18n/navigation';
import { requireLocale } from '@/i18n/require-locale';
import { getMe } from '@/lib/server-session';

/** Where a new organisation is made: by someone with none yet, or by anyone who wants another. */
export default async function NewOrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const me = await getMe();
  if (!me) return redirect({ href: '/sign-in', locale });
  const t = await getTranslations('organization.create');
  const tMeta = await getTranslations('meta');
  const hasOrganization = me.organizations.length > 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-10">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <span className="text-body font-semibold">{tMeta('title')}</span>
          </div>
          <h1 className="text-title font-semibold tracking-tight text-fg">
            {t(hasOrganization ? 'titleAnother' : 'title')}
          </h1>
          <p className="text-body text-fg-muted">{t('description')}</p>
        </div>
        <CreateOrganizationForm canCancel={hasOrganization} />
      </Card>
    </main>
  );
}
