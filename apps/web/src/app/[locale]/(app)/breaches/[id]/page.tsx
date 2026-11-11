import { setRequestLocale } from 'next-intl/server';
import { BreachPage } from '@/components/breaches/breach-page';
import { requireLocale } from '@/i18n/require-locale';

interface BreachRouteProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function BreachRoute({ params }: BreachRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(requireLocale(locale));

  return <BreachPage breachId={id} />;
}
