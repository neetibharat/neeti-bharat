'use client';

import { IconTrash } from '@tabler/icons-react';
import type { ConnectionSummary } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { useRemoveConnectionMutation } from '@/lib/api/connections-api';

/** Asks first: removing forgets the credentials, so the connection would have to be set up again. */
export function RemoveConnectionButton({ connection }: { connection: ConnectionSummary }) {
  const t = useTranslations('connections.remove');
  const [remove] = useRemoveConnectionMutation();

  return (
    <ConfirmDialog
      trigger={
        <Button
          color="tertiary"
          size="sm"
          isIconOnly
          iconLeading={IconTrash}
          aria-label={t('action', { name: connection.name })}
        />
      }
      title={t('title', { name: connection.name })}
      description={t('body')}
      confirmLabel={t('confirm')}
      onConfirm={() => remove(connection.id)}
    />
  );
}
