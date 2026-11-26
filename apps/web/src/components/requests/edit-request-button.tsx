'use client';

import { IconPencil } from '@tabler/icons-react';
import type { RequestResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useUpdateRequestMutation } from '@/lib/api/requests-api';
import { requestValuesOf } from '@/lib/request-form';
import { RequestForm } from './request-form';

/** Changes the details of a request that is still open. */
export function EditRequestButton({ request }: { request: RequestResponse }) {
  const t = useTranslations('requests');

  return (
    <Modal
      trigger={
        <Button color="secondary" iconLeading={IconPencil}>
          {t('edit')}
        </Button>
      }
      title={t('editTitle')}
      size="lg"
    >
      {(close) => <Editing request={request} onDone={close} />}
    </Modal>
  );
}

function Editing({ request, onDone }: { request: RequestResponse; onDone: () => void }) {
  const t = useTranslations('requests.form');
  const [update, { isLoading, error }] = useUpdateRequestMutation();

  return (
    <RequestForm
      initial={requestValuesOf(request)}
      isNew={false}
      submitLabel={t('save')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async ({ type, personName, personEmail, details, assigneeId }) => {
        const result = await update({
          id: request.id,
          type,
          personName,
          personEmail,
          details,
          assigneeId: assigneeId ?? null,
        });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
