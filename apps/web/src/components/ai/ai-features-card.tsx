'use client';

import { AI_FEATURES, type AiFeature, type AiSettingsResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { Switch } from '@/components/base/switch/switch';
import { useSetAiFeaturesMutation } from '@/lib/api/ai-api';
import { withFeature } from '@/lib/ai-features';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

function FeatureRow(props: {
  feature: AiFeature;
  on: boolean;
  isDisabled: boolean;
  onChange: (on: boolean) => void;
}) {
  const t = useTranslations('ai.features.items');

  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-body font-medium text-fg">{t(`${props.feature}.name`)}</p>
        <p className="text-label text-fg-muted">{t(`${props.feature}.about`)}</p>
        <p className="text-caption text-fg-subtle">{t(`${props.feature}.sends`)}</p>
      </div>
      <Switch
        aria-label={t(`${props.feature}.name`)}
        isSelected={props.on}
        isDisabled={props.isDisabled}
        onChange={props.onChange}
      />
    </li>
  );
}

/** Each AI feature can be switched off on its own. Switching one off leaves the key and the model as they are. */
export function AiFeaturesCard({ settings }: { settings: AiSettingsResponse }) {
  const t = useTranslations('ai.features');
  const errorMessage = useErrorMessage();
  const [save, { isLoading, error }] = useSetAiFeaturesMutation();

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="flex flex-col gap-4">
        <ul className="divide-y divide-line">
          {AI_FEATURES.map((feature) => (
            <FeatureRow
              key={feature}
              feature={feature}
              on={!settings.disabledFeatures.includes(feature)}
              isDisabled={isLoading}
              onChange={(on) =>
                void save({
                  disabledFeatures: withFeature(
                    settings.disabledFeatures,
                    AI_FEATURES,
                    feature,
                    on,
                  ),
                })
              }
            />
          ))}
        </ul>
        {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      </div>
    </Card>
  );
}
