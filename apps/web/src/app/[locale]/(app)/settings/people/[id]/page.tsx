import { setRequestLocale } from 'next-intl/server';
import { PersonPage } from '@/components/people/person-page';
import { requireLocale } from '@/i18n/require-locale';
import { requireAdmin } from '@/lib/server-session';

export default async function PersonRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  await requireAdmin(locale);

  return <PersonPage personId={id} />;
}
