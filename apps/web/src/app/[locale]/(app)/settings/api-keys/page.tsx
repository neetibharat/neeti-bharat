import { setRequestLocale } from 'next-intl/server';
import { ApiKeysPage } from '@/components/api-keys/api-keys-page';
import { requireLocale } from '@/i18n/require-locale';
import { requireAdmin } from '@/lib/server-session';

export default async function ApiKeysRoute({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  await requireAdmin(locale);

  return <ApiKeysPage />;
}
