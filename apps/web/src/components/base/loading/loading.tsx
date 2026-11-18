'use client';

import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/base/spinner/spinner';
import { cx } from '@/lib/utils/cx';

/** A turning spinner in the middle of the space a page or card is about to fill. Give a card's height in `className`. */
export function Loading({ className }: { className?: string }) {
  const t = useTranslations('common');

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('loading')}
      className={cx('grid min-h-48 place-items-center', className)}
    >
      <Spinner className="size-8 text-fg-subtle" />
    </div>
  );
}
