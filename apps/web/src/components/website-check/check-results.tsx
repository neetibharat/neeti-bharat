'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { HeroFact, HeroFacts } from '@/components/base/hero-panel/hero-panel';
import { useGetWebsiteCheckQuery } from '@/lib/api/website-check-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { CheckList } from './check-list';

/** One run: the address and how many things passed, warned and failed, then each thing checked, in groups. */
export function CheckResults({ id }: { id: string }) {
  const t = useTranslations('websiteCheck.results');
  const format = useFormatter();
  const errorMessage = useErrorMessage();
  const { data, error } = useGetWebsiteCheckQuery(id);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
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
        <HeroFacts>
          <HeroFact label={t('passed')} value={String(data.passed)} dot="bg-success" />
          <HeroFact label={t('warned')} value={String(data.warned)} dot="bg-accent" />
          <HeroFact
            label={t('failed')}
            value={String(data.failed)}
            dot="bg-danger"
            isAlert={data.failed > 0}
          />
        </HeroFacts>
      </Card>
      <CheckList results={data.results} />
    </div>
  );
}
