import { setRequestLocale } from 'next-intl/server';
import { DeadlinesPage } from '@/components/deadlines/deadlines-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function DeadlinesRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <DeadlinesPage />;
}
