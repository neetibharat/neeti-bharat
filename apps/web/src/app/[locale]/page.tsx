import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { requireLocale } from '@/i18n/require-locale';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(requireLocale(use(params).locale));
  const t = useTranslations('home');

  return (
    <main>
      <h1>{t('heading')}</h1>
      <p>{t('tagline')}</p>
      <LocaleSwitcher />
    </main>
  );
}
