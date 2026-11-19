import { setRequestLocale } from 'next-intl/server';
import { TrainingPage } from '@/components/training/training-page';
import { requireLocale } from '@/i18n/require-locale';

export default async function TrainingRoute({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale((await params).locale));

  return <TrainingPage />;
}
