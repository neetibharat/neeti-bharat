'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useRouter } from '@/i18n/navigation';
import { useCreateBreachMutation } from '@/lib/api/breaches-api';
import { newBreachValues } from '@/lib/breach-form';
import { BreachForm } from './breach-form';

/** Starts a breach, and opens it so the first steps can be done straight away. */
export function ReportBreachButton() {
  const t = useTranslations('breaches');

  return (
    <Modal
      trigger={
        <Button color="danger" iconLeading={IconAlertTriangle}>
          {t('report')}
        </Button>
      }
      title={t('report')}
      size="lg"
    >
      {(close) => <Reporting onDone={close} />}
    </Modal>
  );
}

function Reporting({ onDone }: { onDone: () => void }) {
  const t = useTranslations('breaches.form');
  const router = useRouter();
  const [create, { isLoading, error }] = useCreateBreachMutation();

  return (
    <BreachForm
      initial={newBreachValues()}
      submitLabel={t('submit')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async ({ peopleAffected, ...request }) => {
        const result = await create({ ...request, peopleAffected: peopleAffected ?? undefined });
        if ('error' in result) return;
        onDone();
        router.push(`/breaches/${encodeURIComponent(result.data.id)}`);
      }}
    />
  );
}
