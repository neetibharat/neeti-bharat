'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { StatTile } from '@/components/base/stat-tile/stat-tile';
import { useGetWebsiteCheckQuery } from '@/lib/api/website-check-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { CheckList } from './check-list';

/** One run: how many things passed, warned and failed, then each of them. */
export function CheckResults({ id }: { id: string }) {
  const t = useTranslations('websiteCheck.results');
  const format = useFormatter();
  const errorMessage = useErrorMessage();
  const { data, error } = useGetWebsiteCheckQuery(id);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label={t('passed')} value={data.passed} />
        <StatTile label={t('warned')} value={data.warned} tone="accent" />
        <StatTile label={t('failed')} value={data.failed} tone="danger" />
      </div>
      <Card
        title={data.url}
        description={t('checked', {
          when: format.dateTime(new Date(data.checkedAt), {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          name: data.checkedByName,
        })}
      >
        <CheckList results={data.results} />
      </Card>
    </div>
  );
}
