'use client';

import { IconLogout } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { Avatar } from '@/components/base/avatar/avatar';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import type { SessionUser } from '@/lib/session-user';

/** The bell and the signed-in person. The person's picture opens a card with who they are and a way to sign out. */
export function UserMenu({ user }: { user: SessionUser }) {
  const tNav = useTranslations('nav');
  const router = useRouter();
  const displayName = user.name || user.email;

  async function signOut() {
    await authClient.signOut();
    router.replace('/sign-in');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <NotificationBell />
      <MenuTrigger>
        <Button
          aria-label={tNav('account')}
          className="grid size-10 cursor-pointer place-items-center overflow-hidden rounded-full border border-line-strong shadow-xs outline-none hover:brightness-95 focus-visible:focus-ring"
        >
          <Avatar name={displayName} size="lg" className="size-full" />
        </Button>
        <Popover
          placement="bottom end"
          className="w-64 rounded-control border border-line bg-surface p-1 shadow-popover entering:animate-pop-in exiting:animate-fade-out"
        >
          <AccountCard user={user} onSignOut={signOut} />
        </Popover>
      </MenuTrigger>
    </div>
  );
}

function AccountCard({ user, onSignOut }: { user: SessionUser; onSignOut: () => void }) {
  const t = useTranslations('roles');
  const tAuth = useTranslations('auth');
  const displayName = user.name || user.email;

  return (
    <>
      <div className="min-w-0 border-b border-line px-2.5 py-2" title={user.email}>
        <p className="truncate text-label font-medium text-fg">{displayName}</p>
        <p className="truncate text-caption text-fg-subtle">{user.email}</p>
        <p className="truncate text-caption text-fg-subtle">{t(user.role)}</p>
      </div>
      <Menu onAction={onSignOut} className="pt-1 outline-none">
        <MenuItem
          textValue={tAuth('signOut')}
          className="flex cursor-pointer items-center gap-2 rounded-[calc(var(--radius-control)-0.25rem)] px-2.5 py-2 text-body text-fg outline-none data-focused:bg-brand-soft"
        >
          <IconLogout className="size-4 text-fg-subtle" />
          {tAuth('signOut')}
        </MenuItem>
      </Menu>
    </>
  );
}
