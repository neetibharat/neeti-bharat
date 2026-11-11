import { setRequestLocale } from 'next-intl/server';
import { ProofPage } from '@/components/proof/proof-page';
import { requireLocale } from '@/i18n/require-locale';

interface ProofRouteProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ control?: string }>;
}

export default async function ProofRoute({ params, searchParams }: ProofRouteProps) {
  setRequestLocale(requireLocale((await params).locale));
  const { control } = await searchParams;

  return <ProofPage controlId={control} />;
}
