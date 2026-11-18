'use client';

import { IconTrash } from '@tabler/icons-react';
import type { AiSettingsResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Loading } from '@/components/base/loading/loading';
import { useGetAiSettingsQuery, useRemoveAiSettingsMutation } from '@/lib/api/ai-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { AiSettingsForm } from './ai-settings-form';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="text-body font-medium text-fg">{value}</dd>
    </div>
  );
}

/** Change it, or take it away. Removing asks first, because the key would have to be entered again. */
function SettingActions({ onChange }: { onChange: () => void }) {
  const t = useTranslations('ai');
  const [remove] = useRemoveAiSettingsMutation();

  return (
    <div className="flex gap-2">
      <Button color="secondary" onPress={onChange}>
        {t('current.change')}
      </Button>
      <ConfirmDialog
        trigger={
          <Button color="tertiary" iconLeading={IconTrash}>
            {t('remove.button')}
          </Button>
        }
        title={t('remove.title')}
        description={t('remove.body')}
        confirmLabel={t('remove.confirm')}
        onConfirm={() => remove()}
      />
    </div>
  );
}

/** Which service reads the files, and who set it. The key itself is never here, only its last four characters. */
function CurrentSetting(props: { settings: AiSettingsResponse; onChange: () => void }) {
  const t = useTranslations('ai');
  const tProviders = useTranslations('ai.providers');
  const { provider, model, keyHint, configuredByName } = props.settings;
  if (!provider) return null;

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid gap-4 sm:grid-cols-3">
        <Fact label={t('current.provider')} value={tProviders(provider)} />
        <Fact label={t('current.model')} value={model ?? ''} />
        <Fact label={t('current.key')} value={t('current.keyEnding', { hint: keyHint ?? '' })} />
      </dl>
      <p className="text-label text-fg-muted">
        {t('current.setBy', { name: configuredByName ?? '' })}
      </p>
      <SettingActions onChange={props.onChange} />
    </div>
  );
}

/** The card: what is set, or the form to set it. */
function ServiceCard({ settings }: { settings: AiSettingsResponse }) {
  const t = useTranslations('ai');
  const [changing, setChanging] = useState(false);
  const { provider, model } = settings;

  return (
    <Card
      title={t('card.title')}
      description={t('card.description')}
      actions={
        <Badge color={provider ? 'success' : 'gray'}>
          {t(provider ? 'status.on' : 'status.off')}
        </Badge>
      }
    >
      {provider && !changing ? (
        <CurrentSetting settings={settings} onChange={() => setChanging(true)} />
      ) : (
        <AiSettingsForm
          current={provider ? { provider, model: model ?? '' } : null}
          onCancel={provider ? () => setChanging(false) : undefined}
          onDone={() => setChanging(false)}
        />
      )}
    </Card>
  );
}

/** Optional help with drafting, which needs the company's own key to an AI service. Only admins reach it. */
export function AiHelpPage() {
  const t = useTranslations('ai');
  const tPages = useTranslations('pages.aiHelp');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetAiSettingsQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader title={tPages('title')} description={tPages('description')} />
      <div className="flex flex-col gap-5">
        {!data.enabled && <Alert tone="error">{t('noSecrets')}</Alert>}
        <ServiceCard settings={data} />
        <Alert>{t('privacy')}</Alert>
      </div>
    </>
  );
}
