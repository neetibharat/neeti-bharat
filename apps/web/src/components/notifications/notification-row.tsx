'use client';

import {
  IconAlertTriangle,
  IconFileCheck,
  IconInbox,
  IconPaperclip,
  type Icon,
} from '@tabler/icons-react';
import type { NotificationKind, NotificationSummary } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { IconLinkRow, type RowTone } from '@/components/base/icon-link-row/icon-link-row';
import { workHref } from '@/lib/my-work-tabs';

const LOOK: Record<NotificationKind, { icon: Icon }> = {
  breach: { icon: IconAlertTriangle },
  request: { icon: IconInbox },
  proof: { icon: IconPaperclip },
  review: { icon: IconFileCheck },
};

/** One notice: what is due or late, opening the thing itself. A notice that has not been read has a dot. */
export function NotificationRow({
  notice,
  onOpen,
}: {
  notice: NotificationSummary;
  onOpen: () => void;
}) {
  const t = useTranslations('notifications');
  const format = useFormatter();
  const sentence = t as unknown as (key: string, values: Record<string, string>) => string;
  const date = notice.dueOn
    ? format.dateTime(new Date(notice.dueOn), { dateStyle: 'medium', timeZone: 'UTC' })
    : '';
  const tone: RowTone = notice.state === 'overdue' ? 'danger' : 'accent';

  return (
    <IconLinkRow
      href={workHref(notice.kind, notice.subjectId)}
      onOpen={onOpen}
      icon={LOOK[notice.kind].icon}
      tone={tone}
      title={sentence(`text.${notice.kind}.${notice.state}`, { title: notice.title, date })}
      subtitle={t(`kinds.${notice.kind}`)}
      trailing={
        notice.readAt ? null : (
          <span className="size-2 shrink-0 rounded-full bg-brand" aria-label={t('unread')} />
        )
      }
    />
  );
}
