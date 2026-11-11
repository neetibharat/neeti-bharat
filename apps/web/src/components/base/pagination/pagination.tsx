'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';

export interface PaginationProps {
  /** From 1. */
  page: number;
  pageSize: number;
  /** Every item across all pages. */
  total: number;
  onPageChange: (page: number) => void;
}

/** "26–50 of 112" with previous and next. Shows nothing when everything fits on one page. */
export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const t = useTranslations('pagination');
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const last = Math.ceil(total / pageSize);

  return (
    <nav aria-label={t('label')} className="mt-4 flex items-center justify-between gap-3">
      <p className="text-label text-fg-muted tabular-nums">{t('showing', { from, to, total })}</p>
      <div className="flex gap-2">
        <Button
          color="secondary"
          size="sm"
          isDisabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
        >
          {t('previous')}
        </Button>
        <Button
          color="secondary"
          size="sm"
          isDisabled={page >= last}
          onPress={() => onPageChange(page + 1)}
        >
          {t('next')}
        </Button>
      </div>
    </nav>
  );
}
