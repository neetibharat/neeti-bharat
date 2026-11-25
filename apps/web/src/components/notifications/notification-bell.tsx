'use client';

import { IconBell } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useGetUnreadCountQuery } from '@/lib/api/notifications-api';

/** How often the bell asks whether there is anything new, in milliseconds. */
const POLL_MS = 60_000;

/** A bell with the number of unread notices. It opens the inbox. */
export function NotificationBell() {
  const t = useTranslations('notifications');
  const { data } = useGetUnreadCountQuery(undefined, { pollingInterval: POLL_MS });
  const unread = data?.unread ?? 0;

  return (
    <Link
      href="/notifications"
      aria-label={t('bell', { count: unread })}
      className="relative grid size-10 shrink-0 place-items-center rounded-full bg-surface text-fg-muted ring-1 ring-line-strong ring-inset shadow-xs transition hover:bg-surface-muted hover:text-fg focus-visible:focus-ring"
    >
      <IconBell className="size-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-caption font-semibold text-on-brand">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
