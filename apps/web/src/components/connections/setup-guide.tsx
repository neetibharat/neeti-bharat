'use client';

import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';

const STEPS = ['register', 'ids', 'secret', 'reader', 'graph'] as const;

/**
 * How to make the app registration the connection signs in with. It takes the place of the form while it is open, so the
 * dialog stays one screen tall, and "back" returns to the form with what was typed still in it.
 */
export function SetupGuide({ onBack }: { onBack: () => void }) {
  const t = useTranslations('connections.setup');

  return (
    <div className="flex flex-col gap-4 text-body">
      <h3 className="text-subtitle font-semibold text-fg">{t('title')}</h3>
      <p className="text-fg-muted">{t('intro')}</p>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-fg-muted">
        {STEPS.map((step) => (
          <li key={step}>{t(`steps.${step}`)}</li>
        ))}
      </ol>
      <p className="text-label text-fg-subtle">{t('note')}</p>
      <div className="flex justify-end">
        <Button color="secondary" iconLeading={IconArrowLeft} onPress={onBack}>
          {t('back')}
        </Button>
      </div>
    </div>
  );
}
