'use client';

import type { MeResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Avatar } from '@/components/base/avatar/avatar';

export function UserFooter({ user }: { user: MeResponse }) {
  const t = useTranslations('roles');
  const displayName = user.name || user.email;

  return (
    <div className="flex items-center gap-3 border-t border-line p-3">
      <Avatar name={displayName} />
      <div className="min-w-0 flex-1" title={user.email}>
        <p className="truncate text-label font-medium text-fg">{displayName}</p>
        <p className="truncate text-caption text-fg-subtle">{t(user.role)}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
