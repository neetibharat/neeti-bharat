import { setRequestLocale } from 'next-intl/server';
import { BreachesPage } from '@/components/breaches/breaches-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function BreachesRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <BreachesPage />;
}
