import { setRequestLocale } from 'next-intl/server';
import { RequestPage } from '@/components/requests/request-page';
import { requireLocale } from '@/i18n/require-locale';

interface RequestRouteProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function RequestRoute({ params }: RequestRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(requireLocale(locale));

  return <RequestPage requestId={id} />;
}
