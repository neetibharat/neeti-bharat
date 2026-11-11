'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useRouter } from '@/i18n/navigation';
import { useCreateRequestMutation } from '@/lib/api/requests-api';
import { newRequestValues } from '@/lib/request-form';
import { RequestForm } from './request-form';

/** Logs a request that arrived by email or in person, and opens it so the identity check can start. */
export function LogRequestButton() {
  const t = useTranslations('requests');

  return (
    <Modal trigger={<Button iconLeading={IconPlus}>{t('log')}</Button>} title={t('log')} size="lg">
      {(close) => <Logging onDone={close} />}
    </Modal>
  );
}

function Logging({ onDone }: { onDone: () => void }) {
  const t = useTranslations('requests.form');
  const router = useRouter();
  const [create, { isLoading, error }] = useCreateRequestMutation();

  return (
    <RequestForm
      initial={newRequestValues()}
      isNew
      submitLabel={t('submit')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (request) => {
        const result = await create(request);
        if ('error' in result) return;
        onDone();
        router.push(`/requests/${encodeURIComponent(result.data.id)}`);
      }}
    />
  );
}
