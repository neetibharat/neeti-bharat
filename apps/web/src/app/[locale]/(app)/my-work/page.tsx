import { setRequestLocale } from 'next-intl/server';
import { MyWorkPage } from '@/components/my-work/my-work-page';
import { requireLocale } from '@/i18n/require-locale';

interface MyWorkRouteProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ person?: string }>;
}

export default async function MyWorkRoute({ params, searchParams }: MyWorkRouteProps) {
  setRequestLocale(requireLocale((await params).locale));
  const { person } = await searchParams;

  return <MyWorkPage initialPerson={person} />;
}
