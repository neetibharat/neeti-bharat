'use client';

import {
  CONNECTION_SCHEDULES,
  type ConnectionSchedule,
  type ConnectionSummary,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Select } from '@/components/base/select/select';
import { useSetConnectionScheduleMutation } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** How often the account is checked without anyone asking. An admin changes it; everyone else is told what it is. */
export function ScheduleControl({
  connection,
  canChange,
}: {
  connection: ConnectionSummary;
  canChange: boolean;
}) {
  const t = useTranslations('cloudTests.schedule');
  const errorMessage = useErrorMessage();
  const [save, { isLoading, error }] = useSetConnectionScheduleMutation();
  const { schedule } = connection;
  if (!canChange && schedule === 'off') return null;

  return (
    <div className="flex min-w-0 max-w-sm flex-col gap-2">
      {canChange ? (
        <Select<ConnectionSchedule>
          label={t('label')}
          selectedKey={schedule}
          isDisabled={isLoading}
          onSelectionChange={(next) => void save({ id: connection.id, schedule: next })}
          options={CONNECTION_SCHEDULES.map((id) => ({ id, label: t(`options.${id}`) }))}
          className="w-full max-w-[14rem]"
        />
      ) : (
        <p className="text-label text-fg-muted">
          {t('readOnly', { schedule: t(`options.${schedule}`) })}
        </p>
      )}
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      {connection.scheduleFailedAt && schedule !== 'off' && (
        <Alert tone="error" title={t('failedTitle')}>
          {t('failedBody')}
        </Alert>
      )}
    </div>
  );
}
