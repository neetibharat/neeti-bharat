'use client';

import { IconMailForward } from '@tabler/icons-react';
import type { PersonResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { useResendInvitationMutation } from '@/lib/api/people-api';

/** "Resend invitation": for someone whose invitation is still waiting or has run out. Sends a fresh link. */
export function ResendInvitationButton({ person }: { person: PersonResponse }) {
  const t = useTranslations('people.resend');
  const [resend] = useResendInvitationMutation();

  return (
    <ConfirmDialog
      tone="primary"
      trigger={
        <Button
          color="tertiary"
          size="sm"
          isIconOnly
          iconLeading={IconMailForward}
          aria-label={t('action')}
        />
      }
      title={t('title', { name: person.name })}
      description={t('body', { email: person.email })}
      confirmLabel={t('confirm')}
      onConfirm={() => resend(person.id)}
    />
  );
}
