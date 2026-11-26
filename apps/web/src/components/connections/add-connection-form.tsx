'use client';

import {
  AZURE_CREDENTIAL_FIELDS,
  AZURE_ID_PATTERN,
  CONNECTION_NAME_MAX_LENGTH,
  CONNECTION_SECRET_MAX_LENGTH,
  type AzureCredentialField,
  type AzureSubscription,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import {
  useCreateConnectionMutation,
  useFindSubscriptionsMutation,
} from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { GuideButton } from './guide-button';
import { SetupGuide } from './setup-guide';

type Values = { name: string } & Record<AzureCredentialField, string>;
type Change = (change: Partial<Values>) => void;

const EMPTY: Values = {
  name: '',
  tenantId: '',
  clientId: '',
  subscriptionId: '',
  clientSecret: '',
};

/** What the app registration is typed in with. The subscription is chosen from a list, never typed. */
const APP_FIELDS = AZURE_CREDENTIAL_FIELDS.filter(({ id }) => id !== 'subscriptionId');

const isGuid = (value: string): boolean => AZURE_ID_PATTERN.test(value.trim());

const appIsComplete = (values: Values): boolean =>
  isGuid(values.tenantId) && isGuid(values.clientId) && values.clientSecret.trim() !== '';

const isComplete = (values: Values): boolean =>
  values.name.trim() !== '' && appIsComplete(values) && isGuid(values.subscriptionId);

function CredentialInputs({ values, onChange }: { values: Values; onChange: Change }) {
  const t = useTranslations('connections.form');

  return (
    <>
      {APP_FIELDS.map(({ id, secret }) => (
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

/** Asks Azure which subscriptions the app can see. What it finds is lost when the details change. */
function useSubscriptions() {
  const [find, { data, isLoading, error, reset }] = useFindSubscriptionsMutation();

  const lookup = (values: Values) =>
    find({
      tenantId: values.tenantId.trim(),
      clientId: values.clientId.trim(),
      clientSecret: values.clientSecret.trim(),
    });

  return { items: data?.items, isLoading, error, reset, lookup };
}

type Found = ReturnType<typeof useSubscriptions>;

const optionOf = ({ id, name }: AzureSubscription) => ({
  id,
  label: name === id ? id : `${name} (${id})`,
});

/** What the lookup found: the list to choose from, or why there is none. */
function SubscriptionChoice({
  values,
  found,
  onChange,
}: {
  values: Values;
  found: Found;
  onChange: Change;
}) {
  const t = useTranslations('connections.form.subscription');
  const errorMessage = useErrorMessage();
  const { items, error } = found;

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!items) return <p className="text-label text-fg-muted">{t('hint')}</p>;
  if (items.length === 0) return <Alert tone="info">{t('none')}</Alert>;
  return (
    <Select
      label={t('label')}
      placeholder={t('placeholder')}
      options={items.map(optionOf)}
      selectedKey={values.subscriptionId || null}
      onSelectionChange={(subscriptionId) => onChange({ subscriptionId })}
    />
  );
}

/** Finds the subscriptions the app can see, to choose one. One is picked for you when it is the only one. */
function SubscriptionPicker({
  values,
  found,
  onChange,
}: {
  values: Values;
  found: Found;
  onChange: Change;
}) {
  const t = useTranslations('connections.form.subscription');

  async function lookup() {
    const result = await found.lookup(values);
    const items = result.data?.items ?? [];
    if (items.length === 1) onChange({ subscriptionId: items[0]!.id });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="self-start"
        color="secondary"
        isDisabled={!appIsComplete(values)}
        isLoading={found.isLoading}
        onPress={() => void lookup()}
      >
        {t(found.items ? 'findAgain' : 'find')}
      </Button>
      <SubscriptionChoice values={values} found={found} onChange={onChange} />
    </div>
  );
}

/** The form's values. A change to the app's details makes what was found, and the choice made from it, out of date. */
function useValues(found: Found) {
  const [values, setValues] = useState<Values>(EMPTY);

  function change(next: Partial<Values>) {
    const touchesApp = APP_FIELDS.some(({ id }) => id in next);
    if (touchesApp) found.reset();
    setValues((current) => ({ ...current, ...next, ...(touchesApp && { subscriptionId: '' }) }));
  }

  return { values, change };
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

/** The name, the app registration, then the subscription chosen from the ones the app can see. */
function ConnectionFields({
  values,
  found,
  onChange,
}: {
  values: Values;
  found: Found;
  onChange: Change;
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
      <SubscriptionPicker values={values} found={found} onChange={onChange} />
    </>
  );
}

/** What the connection is called and the app registration it signs in with. The details are tried before they are kept. */
export function AddConnectionForm({
  onDone,
  guideOpen,
  onGuideChange,
}: {
  onDone: () => void;
  /** Whether the setup guide replaces the form. The dialog around it owns this, to make itself wider for the guide. */
  guideOpen: boolean;
  onGuideChange: (open: boolean) => void;
}) {
  const t = useTranslations('connections.form');
  const errorMessage = useErrorMessage();
  const { add, isLoading, error } = useAddConnection(onDone);
  const found = useSubscriptions();
  const { values, change } = useValues(found);

  // A dialog closed with the guide open must open on the form next time.
  useEffect(() => () => onGuideChange(false), [onGuideChange]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void add(values);
  }

  // The guide replaces the form while it is open. The form's own state lives here, so nothing typed is lost.
  if (guideOpen) return <SetupGuide guide="azure" onBack={() => onGuideChange(false)} />;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <GuideButton label={t('help')} onPress={() => onGuideChange(true)} />
      <ConnectionFields values={values} found={found} onChange={change} />
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
