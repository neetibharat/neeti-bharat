'use client';

import {
  AI_DEFAULT_MODELS,
  AI_KEY_MAX_LENGTH,
  AI_MODEL_MAX_LENGTH,
  AI_PROVIDERS,
  type AiProvider,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { useSaveAiSettingsMutation } from '@/lib/api/ai-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

interface Values {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

type Change = (change: Partial<Values>) => void;

export interface AiSettingsFormProps {
  /** What is set now, to start from. */
  current: { provider: AiProvider; model: string } | null;
  /** Shown beside Save when something is set, to leave without changing it. */
  onCancel?: () => void;
  onDone: () => void;
}

function ProviderSelect({ values, onChange }: { values: Values; onChange: Change }) {
  const t = useTranslations('ai.form');
  const tProviders = useTranslations('ai.providers');

  // The suggested model follows the service, unless the person has typed their own.
  function pick(provider: AiProvider) {
    const untouched = values.model === AI_DEFAULT_MODELS[values.provider];
    onChange({ provider, ...(untouched && { model: AI_DEFAULT_MODELS[provider] }) });
  }

  return (
    <Select
      label={t('provider')}
      options={AI_PROVIDERS.map((id) => ({ id, label: tProviders(id) }))}
      selectedKey={values.provider}
      onSelectionChange={pick}
    />
  );
}

function ModelAndKey({ values, onChange }: { values: Values; onChange: Change }) {
  const t = useTranslations('ai.form');

  return (
    <>
      <Input
        label={t('model')}
        hint={t('modelHint')}
        value={values.model}
        onChange={(model) => onChange({ model })}
        maxLength={AI_MODEL_MAX_LENGTH}
        autoComplete="off"
        isRequired
      />
      <Input
        label={t('apiKey')}
        hint={t('apiKeyHint')}
        type="password"
        value={values.apiKey}
        onChange={(apiKey) => onChange({ apiKey })}
        maxLength={AI_KEY_MAX_LENGTH}
        autoComplete="off"
        isRequired
      />
    </>
  );
}

/** The form's values, and saving them. The key is tried with the service first, so the form stays open if it fails. */
function useAiForm(current: AiSettingsFormProps['current'], onDone: () => void) {
  const [save, { isLoading, error }] = useSaveAiSettingsMutation();
  const provider = current?.provider ?? 'deepseek';
  const [values, setValues] = useState<Values>({
    provider,
    model: current?.model ?? AI_DEFAULT_MODELS[provider],
    apiKey: '',
  });
  const change: Change = (part) => setValues((now) => ({ ...now, ...part }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await save({
      provider: values.provider,
      model: values.model.trim(),
      apiKey: values.apiKey.trim(),
    });
    if (!('error' in result)) onDone();
  }

  const canSave = values.model.trim() !== '' && values.apiKey.trim() !== '';
  return { values, change, submit, canSave, isLoading, error };
}

/** The service, the model and the company's own key. The key is tried before it is kept, and is never shown again. */
export function AiSettingsForm({ current, onCancel, onDone }: AiSettingsFormProps) {
  const t = useTranslations('ai.form');
  const errorMessage = useErrorMessage();
  const { values, change, submit, canSave, isLoading, error } = useAiForm(current, onDone);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <ProviderSelect values={values} onChange={change} />
      <ModelAndKey values={values} onChange={change} />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      {isLoading && <p className="text-label text-fg-muted">{t('wait')}</p>}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={t('save')}
        onCancel={onCancel ?? onDone}
        isDisabled={!canSave}
        isLoading={isLoading}
      />
    </form>
  );
}
