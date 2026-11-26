'use client';

import { IconInfoCircle } from '@tabler/icons-react';
import { DPDP_CONTROLS, DPDP_RULES } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';

const STEPS = ['law', 'controls', 'templates', 'copy', 'proof'] as const;
const PARTS = ['rules', 'policies', 'proof', 'review'] as const;

/** Says where the rules, policies and proof came from, and that they are general guidance, not advice on the company. */
export function WhereFromButton({ policyCount }: { policyCount: number }) {
  const t = useTranslations('policies.whereFrom');

  return (
    <Modal
      size="lg"
      trigger={
        <Button color="secondary" iconLeading={IconInfoCircle}>
          {t('button')}
        </Button>
      }
      title={t('title')}
      description={t('description')}
    >
      {(close) => (
        <div className="flex flex-col gap-5">
          <Steps policyCount={policyCount} />
          <dl className="flex flex-col gap-3">
            {PARTS.map((part) => (
              <div key={part}>
                <dt className="text-body font-semibold text-fg">{t(`${part}.title`)}</dt>
                <dd className="mt-0.5 text-body text-fg-muted">{t(`${part}.text`)}</dd>
              </div>
            ))}
          </dl>
          <div className="flex justify-end">
            <Button onPress={close}>{t('close')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** The five steps from the law to an approved policy, top to bottom. */
function Steps({ policyCount }: { policyCount: number }) {
  const t = useTranslations('policies.flow');
  const values = {
    rules: DPDP_RULES.length,
    controls: DPDP_CONTROLS.length,
    policies: policyCount,
  };

  return (
    <ol className="flex flex-col gap-3 rounded-control bg-surface-muted/60 p-4">
      {STEPS.map((step, index) => (
        <li key={step} className="flex items-start gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-caption font-semibold text-on-brand">
            {index + 1}
          </span>
          <p className="text-body text-fg">
            <span className="font-semibold">{t(`${step}.title`, values)}</span>
            <span className="text-fg-muted"> · {t(`${step}.text`)}</span>
          </p>
        </li>
      ))}
    </ol>
  );
}
