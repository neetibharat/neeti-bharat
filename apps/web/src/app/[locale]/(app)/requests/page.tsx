import { setRequestLocale } from 'next-intl/server';
import { RequestsPage } from '@/components/requests/requests-page';
import { requireLocale } from '@/i18n/require-locale';
import { parseViewMode } from '@/lib/request-board';

interface RequestsRouteProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}

export default async function RequestsRoute({ params, searchParams }: RequestsRouteProps) {
  setRequestLocale(requireLocale((await params).locale));
  const { view } = await searchParams;

  return <RequestsPage mode={parseViewMode(view)} />;
}
