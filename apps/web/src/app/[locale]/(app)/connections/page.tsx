import { setRequestLocale } from 'next-intl/server';
import { ConnectionsPage } from '@/components/connections/connections-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function ConnectionsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(requireLocale((await params).locale));

  return <ConnectionsPage />;
}
