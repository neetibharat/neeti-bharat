'use client';

import {
  CHECK_ACCEPTANCE_REASON_MAX_LENGTH,
  type CheckAcceptanceResponse,
  type CheckId,
} from '@dpdp-kit/shared';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Modal } from '@/components/base/modal/modal';
import { Textarea } from '@/components/base/textarea/textarea';
import { useCan } from '@/components/providers/user-provider';
import {
  useAcceptCheckMutation,
  useGetCheckAcceptancesQuery,
  useRemoveCheckAcceptanceMutation,
} from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** What has been accepted for one check on one connection, by resource. A whole-check acceptance is under the empty name. */
export function useAcceptances(connectionId: string, checkId: CheckId) {
  const { data } = useGetCheckAcceptancesQuery(connectionId);
  const own = (data?.items ?? []).filter((item) => item.checkId === checkId);
  return new Map<string, CheckAcceptanceResponse>(own.map((item) => [item.resourceName, item]));
}

interface AcceptTarget {
  connectionId: string;
  checkId: CheckId;
  /** Empty accepts the check as a whole. */
  resourceName: string;
}

/** The reason being typed, and saving it with what is being accepted. */
function useAcceptForm({ connectionId, checkId, resourceName }: AcceptTarget, onDone: () => void) {
  const [accept, { isLoading, error }] = useAcceptCheckMutation();
  const [reason, setReason] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await accept({ id: connectionId, checkId, resourceName, reason: reason.trim() });
    if (!('error' in result)) onDone();
  }

  return { reason, setReason, submit, isLoading, error };
}

function AcceptForm({ target, onDone }: { target: AcceptTarget; onDone: () => void }) {
  const t = useTranslations('cloudTests.accept');
  const errorMessage = useErrorMessage();
  const { reason, setReason, submit, isLoading, error } = useAcceptForm(target, onDone);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Textarea
        label={t('reason')}
        hint={t('reasonHint')}
        value={reason}
        onChange={setReason}
        maxLength={CHECK_ACCEPTANCE_REASON_MAX_LENGTH}
        rows={3}
        isRequired
        autoFocus
      />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={t('confirm')}
        onCancel={onDone}
        isDisabled={reason.trim() === ''}
        isLoading={isLoading}
      />
    </form>
  );
}

/** Opens a short form that asks why something the check flags is deliberate. Only people who can change things see it. */
export function AcceptButton(props: AcceptTarget) {
  const t = useTranslations('cloudTests.accept');
  const { canEdit } = useCan();
  if (!canEdit) return null;

  return (
    <Modal
      trigger={
        <Button color="tertiary" size="sm">
          {t('action')}
        </Button>
      }
      title={t('title')}
      description={
        props.resourceName ? t('forResource', { name: props.resourceName }) : t('description')
      }
    >
      {(close) => <AcceptForm target={props} onDone={close} />}
    </Modal>
  );
}

/** Says a flagged thing was accepted, why and by whom, and lets someone who can change things take it back. */
export function AcceptedNote({
  connectionId,
  acceptance,
}: {
  connectionId: string;
  acceptance: CheckAcceptanceResponse;
}) {
  const t = useTranslations('cloudTests.accept');
  const { canEdit } = useCan();
  const [remove, { isLoading }] = useRemoveCheckAcceptanceMutation();

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 text-label text-fg-muted">
        {t('by', { name: acceptance.acceptedByName, reason: acceptance.reason })}
      </p>
      {canEdit && (
        <Button
          color="tertiary"
          size="sm"
          isLoading={isLoading}
          onPress={() => void remove({ id: connectionId, acceptanceId: acceptance.id })}
        >
          {t('takeBack')}
        </Button>
      )}
    </div>
  );
}
