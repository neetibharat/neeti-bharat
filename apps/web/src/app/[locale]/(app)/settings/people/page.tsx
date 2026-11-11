import { setRequestLocale } from 'next-intl/server';
import { PeoplePage } from '@/components/people/people-page';
import { requireLocale } from '@/i18n/require-locale';
import { requireAdmin } from '@/lib/server-session';

export default async function PeopleRoute({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  await requireAdmin(locale);

  return <PeoplePage />;
}
