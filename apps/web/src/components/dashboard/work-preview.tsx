'use client';

import { IconCircleCheck } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Loading } from '@/components/base/loading/loading';
import { Card } from '@/components/base/card/card';
import { MyWorkRow } from '@/components/my-work/my-work-row';
import { Link } from '@/i18n/navigation';
import { useGetMyWorkQuery } from '@/lib/api/my-work-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

const MAX_ROWS = 4;

/** The first few things waiting on the signed-in person, with a way into the whole list. */
export function WorkPreview() {
  const t = useTranslations('dashboard.preview');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetMyWorkQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading className="h-56" />;
  const rest = data.items.length - MAX_ROWS;

  return (
    <Card
      title={t('title')}
      description={t('description')}
      actions={
        <Link href="/my-work" className="text-label font-medium text-brand hover:underline">
          {t('all')}
        </Link>
      }
    >
      {data.items.length === 0 ? (
        <p className="flex items-center gap-2 text-body text-fg-muted">
          <IconCircleCheck className="size-5 text-success" />
          {t('clear')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.items.slice(0, MAX_ROWS).map((item) => (
            <MyWorkRow key={`${item.kind}:${item.id}:${item.context}`} item={item} />
          ))}
        </ul>
      )}
      {rest > 0 && <p className="mt-3 text-caption text-fg-muted">{t('more', { count: rest })}</p>}
    </Card>
  );
}
