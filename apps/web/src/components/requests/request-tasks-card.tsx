'use client';

import { IconPlus } from '@tabler/icons-react';
import { REQUEST_SYSTEM_MAX_LENGTH, type RequestResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { Input } from '@/components/base/input/input';
import { useCan } from '@/components/providers/user-provider';
import { useAddRequestTaskMutation } from '@/lib/api/requests-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { RequestTaskRow } from './request-task-row';

/** Adds a system that holds the person's data. It can be done at any time while the request is open. */
function AddTaskForm({ requestId }: { requestId: string }) {
  const t = useTranslations('requests.tasks');
  const errorMessage = useErrorMessage();
  const [system, setSystem] = useState('');
  const [add, { isLoading, error }] = useAddRequestTaskMutation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const name = system.trim();
    if (!name) return;
    const result = await add({ id: requestId, system: name });
    if (!('error' in result)) setSystem('');
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
      <div className="flex items-end gap-3">
        <Input
          label={t('system')}
          placeholder={t('systemPlaceholder')}
          className="flex-1"
          value={system}
          onChange={setSystem}
          maxLength={REQUEST_SYSTEM_MAX_LENGTH}
        />
        <Button
          type="submit"
          color="secondary"
          iconLeading={IconPlus}
          isDisabled={system.trim() === ''}
          isLoading={isLoading}
        >
          {t('add')}
        </Button>
      </div>
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
    </form>
  );
}

/** Each system that holds the person's data is a task: done, erased, or kept by law with a reason. */
export function RequestTasksCard({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests.tasks');
  const { canEdit } = useCan();
  const isOpen = request.closedAt === null;
  const canChange = canEdit && isOpen;
  const identityVerified = request.identityVerifiedAt !== null;

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="flex flex-col gap-4">
        {!identityVerified && isOpen && <Alert tone="info">{t('needsIdentity')}</Alert>}
        {request.tasks.length === 0 ? (
          <p className="text-body text-fg-muted">{t('empty')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {request.tasks.map((task) => (
              <RequestTaskRow
                key={`${task.id}:${task.outcome}:${task.reason ?? ''}`}
                requestId={request.id}
                task={task}
                canChange={canChange}
                identityVerified={identityVerified}
              />
            ))}
          </ul>
        )}
        {canChange && <AddTaskForm requestId={request.id} />}
      </div>
    </Card>
  );
}
