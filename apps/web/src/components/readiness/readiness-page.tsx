'use client';

import type { ReadinessAnswers, ReadinessResponse } from '@neeti-bharat/shared';
import { IconGauge } from '@tabler/icons-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Loading } from '@/components/base/loading/loading';
import { useCan } from '@/components/providers/user-provider';
import { useGetReadinessQuery, useTakeReadinessCheckMutation } from '@/lib/api/readiness-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { ReadinessForm } from './readiness-form';
import { ReadinessResult } from './readiness-result';

function History({ history }: { history: ReadinessResponse['history'] }) {
  const t = useTranslations('readiness.history');
  const format = useFormatter();
  if (history.length < 2) return null;

  return (
    <Card title={t('title')}>
      <ul className="divide-y divide-line">
        {history.map((check) => (
          <li
            key={check.id}
            className="flex items-center justify-between gap-4 py-2.5 text-body first:pt-0 last:pb-0"
          >
            <span className="text-fg-muted">
              {format.dateTime(new Date(check.takenAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              {` · ${check.takenByName}`}
            </span>
            <span className="font-medium tabular-nums text-fg">
              {t('score', { score: check.score })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Taking the check, from the first area or from the last answers, and leaving the form when it is saved. */
function useTaking(onSaved: () => void) {
  const errorMessage = useErrorMessage();
  const [take, { isLoading, error }] = useTakeReadinessCheckMutation();

  async function submit(answers: ReadinessAnswers) {
    const result = await take({ answers });
    if (result.data) onSaved();
  }

  return { submit, isLoading, problem: error ? errorMessage(error) : null };
}

interface BodyProps {
  data: ReadinessResponse;
  canEdit: boolean;
  taking: boolean;
  setTaking: (taking: boolean) => void;
}

function Body({ data, canEdit, taking, setTaking }: BodyProps) {
  const t = useTranslations('readiness');
  const { submit, isLoading, problem } = useTaking(() => setTaking(false));

  if (canEdit && (taking || !data.latest)) {
    return (
      <ReadinessForm
        initial={data.latest?.answers}
        isSaving={isLoading}
        problem={problem}
        onSubmit={(answers) => void submit(answers)}
        onLeave={data.latest ? () => setTaking(false) : undefined}
      />
    );
  }
  if (!data.latest) {
    return (
      <Card variant="dashed">
        <EmptyState icon={IconGauge} title={t('empty.title')} description={t('empty.readOnly')} />
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <ReadinessResult check={data.latest} />
      <History history={data.history} />
    </div>
  );
}

/** How ready the company is: the latest score, a way to take the check again, and the scores so far. */
export function ReadinessPage() {
  const t = useTranslations('readiness');
  const errorMessage = useErrorMessage();
  const { canEdit } = useCan();
  const [taking, setTaking] = useState(false);
  const { data, error } = useGetReadinessQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;
  const canRetake = canEdit && !taking && data.latest !== null;

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          canRetake ? <Button onPress={() => setTaking(true)}>{t('retake')}</Button> : undefined
        }
      />
      <Body data={data} canEdit={canEdit} taking={taking} setTaking={setTaking} />
    </>
  );
}
