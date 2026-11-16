import { setRequestLocale } from 'next-intl/server';
import { WebsiteCheckPage } from '@/components/website-check/website-check-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function WebsiteCheckRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(requireLocale((await params).locale));

  return <WebsiteCheckPage />;
}
