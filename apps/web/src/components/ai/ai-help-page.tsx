'use client';

import type { AiSettingsResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import { useGetAiSettingsQuery } from '@/lib/api/ai-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { AiFeaturesCard } from './ai-features-card';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="text-body font-medium text-fg">{value}</dd>
    </div>
  );
}

/** Which service the install uses. The key itself is never here, only its last four characters. */
function Service({ settings }: { settings: AiSettingsResponse }) {
  const t = useTranslations('ai');
  const tProviders = useTranslations('ai.providers');
  const { provider, model, keyHint } = settings;

  if (!provider) return <Alert tone="info">{t('card.notSet')}</Alert>;
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      <Fact label={t('current.provider')} value={tProviders(provider)} />
      <Fact label={t('current.model')} value={model ?? ''} />
      <Fact label={t('current.key')} value={t('current.keyEnding', { hint: keyHint ?? '' })} />
    </dl>
  );
}

/** The install's AI service, which is set in its environment and cannot be changed here. */
function ServiceCard({ settings }: { settings: AiSettingsResponse }) {
  const t = useTranslations('ai');

  return (
    <Card
      title={t('card.title')}
      description={t('card.description')}
      actions={
        <Badge color={settings.provider ? 'success' : 'gray'}>
          {t(settings.provider ? 'status.on' : 'status.off')}
        </Badge>
      }
    >
      <Service settings={settings} />
    </Card>
  );
}

/** Optional help with drafting. The install's AI service is set in its environment; an admin chooses the features. */
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
        <ServiceCard settings={data} />
        {data.provider && <AiFeaturesCard settings={data} />}
        <Alert>{t('privacy')}</Alert>
      </div>
    </>
  );
}
