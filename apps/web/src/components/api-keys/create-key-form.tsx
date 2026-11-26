'use client';

import {
  API_KEY_NAME_MAX_LENGTH,
  API_KEY_ROLES,
  type CreatedApiKeyResponse,
} from '@neeti-bharat/shared';
import type { ApiKeyRole } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { useCreateApiKeyMutation } from '@/lib/api/api-keys-api';
import { EXPIRY_CHOICES, lifetimeOf, type ExpiryChoice } from '@/lib/api-keys';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

export interface CreateKeyFormProps {
  onCreated: (created: CreatedApiKeyResponse) => void;
  onCancel: () => void;
}

interface Values {
  name: string;
  role: ApiKeyRole;
  expiry: ExpiryChoice;
}

function KeyFields({
  values,
  onChange,
}: {
  values: Values;
  onChange: (change: Partial<Values>) => void;
}) {
  const t = useTranslations('apiKeys');

  return (
    <>
      <Input
        label={t('form.name')}
        placeholder={t('form.namePlaceholder')}
        value={values.name}
        onChange={(name) => onChange({ name })}
        maxLength={API_KEY_NAME_MAX_LENGTH}
        isRequired
      />
      <Select
        label={t('form.access')}
        options={API_KEY_ROLES.map((id) => ({ id, label: t(`roles.${id}`) }))}
        selectedKey={values.role}
        onSelectionChange={(role) => onChange({ role })}
      />
      <p className="-mt-2 text-label text-fg-muted">{t(`roleHelp.${values.role}`)}</p>
      <Select
        label={t('form.expires')}
        options={EXPIRY_CHOICES.map((id) => ({
          id,
          label: id === 'never' ? t('form.expiryNever') : t('form.expiryDays', { days: id }),
        }))}
        selectedKey={values.expiry}
        onSelectionChange={(expiry) => onChange({ expiry })}
      />
    </>
  );
}

/** What the key is called, what it may do, and how long it lasts. */
export function CreateKeyForm({ onCreated, onCancel }: CreateKeyFormProps) {
  const t = useTranslations('apiKeys.form');
  const errorMessage = useErrorMessage();
  const [create, { isLoading, error }] = useCreateApiKeyMutation();
  const [values, setValues] = useState<Values>({ name: '', role: 'member', expiry: 'never' });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await create({
      name: values.name.trim(),
      role: values.role,
      expiresInDays: lifetimeOf(values.expiry),
    });
    if (result.data) onCreated(result.data);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <KeyFields values={values} onChange={(change) => setValues({ ...values, ...change })} />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={t('submit')}
        onCancel={onCancel}
        isDisabled={values.name.trim() === ''}
        isLoading={isLoading}
      />
    </form>
  );
}
