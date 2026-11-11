'use client';

import { EXPORT_DATASETS } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { PageHeader } from '@/components/base/page-header/page-header';
import { DownloadButton } from './download-button';

/** What an auditor asks for: everything in one zip, or one list at a time as a spreadsheet. */
export function ExportsPage() {
  const t = useTranslations('exports');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="flex flex-col gap-6">
        <Card
          title={t('pack.title')}
          description={t('pack.description')}
          actions={
            <DownloadButton
              path="/exports/audit-pack"
              fallbackName="audit-pack.zip"
              label={t('pack.download')}
            />
          }
        />
        <Card title={t('lists.title')} description={t('lists.description')}>
          <ul className="divide-y divide-line">
            {EXPORT_DATASETS.map((dataset) => (
              <DatasetRow key={dataset} dataset={dataset} />
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function DatasetRow({ dataset }: { dataset: (typeof EXPORT_DATASETS)[number] }) {
  const t = useTranslations('exports');

  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-body font-medium text-fg">{t(`datasets.${dataset}.name`)}</p>
        <p className="text-label text-fg-muted">{t(`datasets.${dataset}.about`)}</p>
      </div>
      <DownloadButton
        path={`/exports/csv/${dataset}`}
        fallbackName={`${dataset}.csv`}
        label={t('lists.download')}
        color="secondary"
        size="sm"
      />
    </li>
  );
}
