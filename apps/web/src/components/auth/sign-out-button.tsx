'use client';

import { IconLogout } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Tooltip } from '@/components/base/tooltip/tooltip';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const t = useTranslations('auth');
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace('/sign-in');
    router.refresh();
  }

  return (
    <Tooltip label={t('signOut')}>
      <Button
        color="tertiary"
        size="sm"
        isIconOnly
        iconLeading={IconLogout}
        aria-label={t('signOut')}
        onPress={signOut}
      />
    </Tooltip>
  );
}
