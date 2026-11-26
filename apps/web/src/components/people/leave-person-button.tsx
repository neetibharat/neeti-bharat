'use client';

import { IconUserOff } from '@tabler/icons-react';
import type { LeaveResponse, PersonResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { baseApi } from '@/lib/api/base-api';
import { useGetProfileQuery } from '@/lib/api/profile-api';
import { CHANGES } from '@/lib/api/tags';
import { useLeavePersonMutation } from '@/lib/api/people-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** "Mark as left": asks first, then says what it did and what is still left for the admin to do. */
export function LeavePersonButton({ person }: { person: PersonResponse }) {
  const t = useTranslations('people.leave');
  return (
    <Modal
      trigger={
        <Button
          color="tertiary"
          size="sm"
          isIconOnly
          iconLeading={IconUserOff}
          aria-label={t('action')}
        />
      }
      title={t('title', { name: person.name })}
    >
      {(close) => <LeaveFlow person={person} onDone={close} />}
    </Modal>
  );
}

function LeaveFlow({ person, onDone }: { person: PersonResponse; onDone: () => void }) {
  const t = useTranslations('people.leave');
  const errorMessage = useErrorMessage();
  const [leave, { data, isLoading, error }] = useLeavePersonMutation();
  const dispatch = useDispatch();
  const done = Boolean(data);

  // Lists refresh once the admin has read the result and closed the dialog, not before: the row would move tabs.
  useEffect(() => {
    if (!done) return;
    return () => {
      dispatch(baseApi.util.invalidateTags([...CHANGES.person]));
    };
  }, [done, dispatch]);

  if (data) return <LeaveResult name={person.name} result={data} onDone={onDone} />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-fg-muted">{t('body')}</p>
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      <div className="flex justify-end gap-2">
        <Button color="secondary" onPress={onDone}>
          {t('done')}
        </Button>
        <Button color="danger" isLoading={isLoading} onPress={() => void leave(person.id)}>
          {t('confirm')}
        </Button>
      </div>
    </div>
  );
}

/** The login is already off. What is left is access in systems this product cannot reach yet. */
function LeaveResult({
  name,
  result,
  onDone,
}: {
  name: string;
  result: LeaveResponse;
  onDone: () => void;
}) {
  const t = useTranslations('people.leave');
  const tRoles = useTranslations('jobRoles');
  const { data: profile } = useGetProfileQuery();
  const limit = profile?.entries.find((entry) => entry.key === 'leaverAccessWithin')?.value;

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="success" title={t('doneTitle', { name })}>
        <p>{t('doneLogin')}</p>
        {result.releasedRoles.length > 0 && (
          <p>
            {t('doneRoles', { roles: result.releasedRoles.map((role) => tRoles(role)).join(', ') })}
          </p>
        )}
        {result.releasedAssignments > 0 && (
          <p>{t('doneAssignments', { count: result.releasedAssignments })}</p>
        )}
        {limit && <p>{t('doneChecklist', { time: limit })}</p>}
      </Alert>
      <div className="flex justify-end">
        <Button onPress={onDone}>{t('done')}</Button>
      </div>
    </div>
  );
}
