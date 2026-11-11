'use client';

import { IconTrash } from '@tabler/icons-react';
import type { ProfileEntryResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { useRemoveProfileEntryMutation } from '@/lib/api/profile-api';

/** Removes an answer people added. Built-in answers never show this. */
export function RemoveEntryButton({ entry }: { entry: ProfileEntryResponse }) {
  const t = useTranslations('profile');
  const [remove] = useRemoveProfileEntryMutation();

  return (
    <ConfirmDialog
      trigger={
        <Button color="tertiary" isIconOnly iconLeading={IconTrash} aria-label={t('removeEntry')} />
      }
      title={t('removeTitle')}
      description={t('removeBody')}
      confirmLabel={t('remove')}
      onConfirm={() => remove(entry.key)}
    />
  );
}
