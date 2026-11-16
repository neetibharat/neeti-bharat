import { setRequestLocale } from 'next-intl/server';
import { ReadinessPage } from '@/components/readiness/readiness-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function ReadinessRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <ReadinessPage />;
}
