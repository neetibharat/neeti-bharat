'use client';

import { IconBan } from '@tabler/icons-react';
import type { ApiKeySummary } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { useRevokeApiKeyMutation } from '@/lib/api/api-keys-api';

/** Asks first, because anything using the key stops working at once. */
export function RevokeKeyButton({ apiKey }: { apiKey: ApiKeySummary }) {
  const t = useTranslations('apiKeys.revoke');
  const [revoke] = useRevokeApiKeyMutation();

  return (
    <ConfirmDialog
      trigger={
        <Button
          color="tertiary"
          size="sm"
          isIconOnly
          iconLeading={IconBan}
          aria-label={t('action', { name: apiKey.name })}
        />
      }
      title={t('title', { name: apiKey.name })}
      description={t('body')}
      confirmLabel={t('confirm')}
      onConfirm={() => revoke(apiKey.id)}
    />
  );
}
