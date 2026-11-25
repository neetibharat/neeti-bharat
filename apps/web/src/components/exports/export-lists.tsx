'use client';

import {
  EXPORT_DATASETS,
  EXPORT_DATED_DATASETS,
  isDatedDataset,
  type ExportDataset,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Card } from '@/components/base/card/card';
import {
  DateRangePicker,
  type DayRange,
  type RangePresetOption,
} from '@/components/base/date-range-picker/date-range-picker';
import { RANGE_PRESETS, presetRange, rangeQuery } from '@/lib/export-range';
import { DownloadButton } from './download-button';

function usePresets(): RangePresetOption[] {
  const t = useTranslations('exports.range.presets');
  const today = new Date();
  return RANGE_PRESETS.map((id) => ({ id, label: t(id), range: presetRange(id, today) }));
}

function DatasetRow({ dataset, range }: { dataset: ExportDataset; range: DayRange | null }) {
  const t = useTranslations('exports');
  const dated = isDatedDataset(dataset);

  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-body font-medium text-fg">{t(`datasets.${dataset}.name`)}</p>
        <p className="text-label text-fg-muted">{t(`datasets.${dataset}.about`)}</p>
        <p className="text-caption text-fg-subtle">
          {dated
            ? t('range.cutBy', { date: t(`range.dates.${EXPORT_DATED_DATASETS[dataset]}`) })
            : t('range.whole')}
        </p>
      </div>
      <DownloadButton
        path={`/exports/csv/${dataset}${dated ? rangeQuery(range) : ''}`}
        fallbackName={`${dataset}.csv`}
        label={t('lists.download')}
        color="secondary"
        size="sm"
      />
    </li>
  );
}

/** Every list as a CSV. The ones that have a date can be cut to a range of days. */
export function ExportLists() {
  const t = useTranslations('exports');
  const [range, setRange] = useState<DayRange | null>(null);
  const presets = usePresets();

  return (
    <div className="flex flex-col gap-4">
      <Card padding="sm" className="flex flex-wrap items-end justify-between gap-4">
        <DateRangePicker
          label={t('range.label')}
          value={range}
          onChange={setRange}
          presets={presets}
          clearLabel={t('range.clear')}
          openLabel={t('range.openCalendar')}
          className="w-72"
        />
        <p className="max-w-md text-label text-fg-muted">{t('range.hint')}</p>
      </Card>
      <Card title={t('lists.title')} description={t('lists.description')}>
        <ul className="divide-y divide-line">
          {EXPORT_DATASETS.map((dataset) => (
            <DatasetRow key={dataset} dataset={dataset} range={range} />
          ))}
        </ul>
      </Card>
    </div>
  );
}
