'use client';

import { CONNECTION_NAME_MAX_LENGTH, CONNECTION_SECRET_MAX_LENGTH } from '@neeti-bharat/shared';
import type { ConnectionSummary } from '@neeti-bharat/shared';
import { IconPencil } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Modal } from '@/components/base/modal/modal';
import { useUpdateConnectionMutation } from '@/lib/api/connections-api';
import { canSaveEdit, changesOf, type EditValues } from '@/lib/connections';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { EditGithubForm } from './edit-github-form';

const initialOf = (connection: ConnectionSummary): EditValues => ({
  name: connection.name,
  tenantId: connection.identifiers.tenantId ?? '',
  clientId: connection.identifiers.clientId ?? '',
  clientSecret: '',
});

type Change = (change: Partial<EditValues>) => void;

/** The app registration it signs in with, and the secret, which is only sent when something is typed. */
function RegistrationFields({ values, onChange }: { values: EditValues; onChange: Change }) {
  const t = useTranslations('connections.form');
  const edit = useTranslations('connections.edit');

  return (
    <>
      <Input
        label={t('fields.tenantId')}
        value={values.tenantId}
        onChange={(tenantId) => onChange({ tenantId })}
        maxLength={36}
        autoComplete="off"
        isRequired
      />
      <Input
        label={t('fields.clientId')}
        value={values.clientId}
        onChange={(clientId) => onChange({ clientId })}
        maxLength={36}
        autoComplete="off"
        isRequired
      />
      <Input
        label={t('fields.clientSecret')}
        hint={edit('secretHint')}
        type="password"
        value={values.clientSecret}
        onChange={(clientSecret) => onChange({ clientSecret })}
        maxLength={CONNECTION_SECRET_MAX_LENGTH}
        autoComplete="new-password"
      />
    </>
  );
}

function Fields({
  values,
  subscriptionId,
  onChange,
}: {
  values: EditValues;
  subscriptionId: string;
  onChange: Change;
}) {
  const t = useTranslations('connections.form');
  const edit = useTranslations('connections.edit');

  return (
    <>
      <Input
        label={t('name')}
        value={values.name}
        onChange={(name) => onChange({ name })}
        maxLength={CONNECTION_NAME_MAX_LENGTH}
        isRequired
      />
      <RegistrationFields values={values} onChange={onChange} />
      <Input
        label={t('fields.subscriptionId')}
        hint={edit('subscriptionHint')}
        value={subscriptionId}
        isDisabled
      />
    </>
  );
}

/** The name, the app registration and a new secret. Only what was changed is sent, and new details are tried first. */
function EditConnectionForm({
  connection,
  onDone,
}: {
  connection: ConnectionSummary;
  onDone: () => void;
}) {
  const t = useTranslations('connections.form');
  const edit = useTranslations('connections.edit');
  const errorMessage = useErrorMessage();
  const [update, { isLoading, error }] = useUpdateConnectionMutation();
  const initial = initialOf(connection);
  const [values, setValues] = useState<EditValues>(initial);
  const changes = changesOf(initial, values);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!changes) return;
    const result = await update({ id: connection.id, ...changes });
    if (!('error' in result)) onDone();
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <Fields
        values={values}
        subscriptionId={connection.identifiers.subscriptionId ?? ''}
        onChange={(change) => setValues({ ...values, ...change })}
      />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      {isLoading && changes?.credentials && <p className="text-label text-fg-muted">{t('wait')}</p>}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={edit('save')}
        onCancel={onDone}
        isDisabled={!changes || !canSaveEdit(values)}
        isLoading={isLoading}
      />
    </form>
  );
}

/** The pencil that opens the form to rename a connection or give it a new secret. Admins only: the caller decides. */
export function EditConnectionButton({
  connection,
  size = 'sm',
}: {
  connection: ConnectionSummary;
  /** Match the buttons beside it. */
  size?: 'sm' | 'md';
}) {
  const t = useTranslations('connections.edit');

  return (
    <Modal
      trigger={
        <Button
          color="secondary"
          size={size}
          isIconOnly
          iconLeading={IconPencil}
          aria-label={t('action', { name: connection.name })}
        />
      }
      title={t('title', { name: connection.name })}
      description={t(connection.provider === 'github' ? 'githubDescription' : 'description')}
      size="lg"
    >
      {(close) =>
        connection.provider === 'github' ? (
          <EditGithubForm connection={connection} onDone={close} />
        ) : (
          <EditConnectionForm connection={connection} onDone={close} />
        )
      }
    </Modal>
  );
}
