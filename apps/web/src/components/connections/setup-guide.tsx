'use client';

import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';

type Guide = 'azure' | 'github';

/** The steps of each guide, and the ones that need someone with more rights, with the name of who. */
const GUIDES: Record<
  Guide,
  {
    namespace: 'connections.setup' | 'connections.githubSetup';
    steps: readonly string[];
    needs: Record<string, string>;
  }
> = {
  azure: {
    namespace: 'connections.setup',
    steps: ['register', 'ids', 'secret', 'reader', 'graph', 'connect'],
    needs: { reader: 'reader', graph: 'graph' },
  },
  github: {
    namespace: 'connections.githubSetup',
    steps: ['create', 'permissions', 'where', 'appId', 'key', 'install', 'connect'],
    needs: { create: 'owner', install: 'owner' },
  },
};

type Words = {
  (key: string, values?: Record<string, string | number>): string;
  rich: (key: string, marks: Record<string, (chunks: ReactNode) => ReactNode>) => ReactNode;
};

/** The marks the guide's text uses: <b> for a name to look for, <code> for a thing to type or find. */
const MARKS = {
  b: (chunks: ReactNode) => <strong className="font-semibold text-fg">{chunks}</strong>,
  code: (chunks: ReactNode) => (
    <code className="rounded-control bg-surface-muted px-1.5 py-0.5 font-mono text-label text-fg">
      {chunks}
    </code>
  ),
};

function Step({ guide, step, number }: { guide: Guide; step: string; number: number }) {
  const { namespace, needs } = GUIDES[guide];
  const t = useTranslations(namespace) as unknown as Words;
  const who = needs[step];

  return (
    <li className="flex gap-4">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-label font-semibold text-brand">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-fg">{t(`steps.${step}.title`)}</h4>
        <p className="mt-0.5 text-fg-muted">{t.rich(`steps.${step}.body`, MARKS)}</p>
        {who && (
          <p className="mt-2">
            <Badge color="warning">{t('needs', { who: t(`who.${who}`) })}</Badge>
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * How to make the app the connection signs in with. It takes the place of the form while it is open, and "back" returns
 * to the form with what was typed still in it.
 */
export function SetupGuide({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  const { namespace, steps } = GUIDES[guide];
  const t = useTranslations(namespace) as unknown as Words;

  return (
    <div className="flex flex-col gap-5 text-body">
      <div className="flex flex-col gap-3">
        <h3 className="text-subtitle font-semibold text-fg">{t('title')}</h3>
        <p className="text-fg-muted">{t('intro')}</p>
        <Alert tone="info">{t('forIt')}</Alert>
      </div>
      <ol className="flex flex-col gap-5">
        {steps.map((step, index) => (
          <Step key={step} guide={guide} step={step} number={index + 1} />
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
