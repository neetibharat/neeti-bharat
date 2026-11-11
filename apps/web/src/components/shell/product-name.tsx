'use client';

import { useTranslations } from 'next-intl';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';

export function ProductName() {
  const t = useTranslations('meta');
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-subtitle font-semibold tracking-tight text-fg">{t('title')}</span>
    </div>
  );
}
