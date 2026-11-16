'use client';

import {
  AZURE_CREDENTIAL_FIELDS,
  AZURE_ID_PATTERN,
  CONNECTION_NAME_MAX_LENGTH,
  CONNECTION_SECRET_MAX_LENGTH,
  type AzureCredentialField,
} from '@dpdp-kit/shared';
import { IconHelpCircle } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { useCreateConnectionMutation } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { SetupGuide } from './setup-guide';

type Values = { name: string } & Record<AzureCredentialField, string>;

const EMPTY: Values = {
  name: '',
  tenantId: '',
  clientId: '',
  subscriptionId: '',
  clientSecret: '',
};

const isComplete = (values: Values): boolean =>
  values.name.trim() !== '' &&
  AZURE_CREDENTIAL_FIELDS.every(({ id, secret }) =>
    secret ? values[id].trim() !== '' : AZURE_ID_PATTERN.test(values[id].trim()),
  );

function CredentialInputs({
  values,
  onChange,
}: {
  values: Values;
  onChange: (change: Partial<Values>) => void;
}) {
  const t = useTranslations('connections.form');

  return (
    <>
      {AZURE_CREDENTIAL_FIELDS.map(({ id, secret }) => (
        <Input
          key={id}
          label={t(`fields.${id}`)}
          type={secret ? 'password' : 'text'}
          value={values[id]}
          onChange={(value) => onChange({ [id]: value })}
          maxLength={secret ? CONNECTION_SECRET_MAX_LENGTH : 36}
          autoComplete="off"
          isRequired
        />
      ))}
    </>
  );
}

/** The name, then the four details of the app registration. */
function ConnectionFields({
  values,
  onChange,
}: {
  values: Values;
  onChange: (change: Partial<Values>) => void;
}) {
  const t = useTranslations('connections.form');

  return (
    <>
      <Input
        label={t('name')}
        placeholder={t('namePlaceholder')}
        value={values.name}
        onChange={(name) => onChange({ name })}
        maxLength={CONNECTION_NAME_MAX_LENGTH}
        isRequired
      />
      <CredentialInputs values={values} onChange={onChange} />
    </>
  );
}

/** Sends the details, trimmed. The form closes once Azure has accepted them. */
function useAddConnection(onDone: () => void) {
  const [create, { isLoading, error }] = useCreateConnectionMutation();

  async function add({ name, ...credentials }: Values) {
    const result = await create({
      provider: 'azure',
      name: name.trim(),
      credentials: Object.fromEntries(
        Object.entries(credentials).map(([key, value]) => [key, value.trim()]),
      ),
    });
    if (!('error' in result)) onDone();
  }

  return { add, isLoading, error };
}

/** What the connection is called and the app registration it signs in with. The details are tried before they are kept. */
export function AddConnectionForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('connections.form');
  const errorMessage = useErrorMessage();
  const { add, isLoading, error } = useAddConnection(onDone);
  const [values, setValues] = useState<Values>(EMPTY);
  const [guideOpen, setGuideOpen] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    void add(values);
  }

  // The guide replaces the form while it is open. The form's own state lives here, so nothing typed is lost.
  if (guideOpen) return <SetupGuide onBack={() => setGuideOpen(false)} />;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Button
        className="self-start"
        color="tertiary"
        size="sm"
        iconLeading={IconHelpCircle}
        onPress={() => setGuideOpen(true)}
      >
        {t('help')}
      </Button>
      <ConnectionFields
        values={values}
        onChange={(change) => setValues({ ...values, ...change })}
      />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      {isLoading && <p className="text-label text-fg-muted">{t('wait')}</p>}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={t('submit')}
        onCancel={onDone}
        isDisabled={!isComplete(values)}
        isLoading={isLoading}
      />
    </form>
  );
}
