'use client';

import { IconUpload } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

/** Where files will go once the app has storage. It is shown now so the page already has its shape, but takes nothing. */
export function FileDropzone() {
  const t = useTranslations('proofPage.files');

  return (
    <div
      aria-disabled="true"
      className="flex flex-col items-center gap-1 rounded-control border border-dashed border-line-strong bg-surface-muted/50 px-4 py-6 text-center opacity-70"
    >
      <span className="grid size-9 place-items-center rounded-full bg-surface text-fg-subtle shadow-card">
        <IconUpload className="size-4" />
      </span>
      <p className="text-label font-medium text-fg">{t('title')}</p>
      <p className="text-caption text-fg-muted">{t('soon')}</p>
    </div>
  );
}
