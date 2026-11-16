'use client';

import {
  IconAlertTriangle,
  IconCalendarDue,
  IconFlame,
  IconHourglassHigh,
  IconInbox,
  IconPaperclip,
  type Icon,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { AttentionList } from '@/components/base/attention-list/attention-list';
import type { RowTone } from '@/components/base/icon-link-row/icon-link-row';
import type { DashboardAttention, DashboardReason } from '@/lib/dashboard-stats';

const LOOK: Record<DashboardReason, { icon: Icon; tone: RowTone }> = {
  breach_overdue: { icon: IconFlame, tone: 'danger' },
  breach_open: { icon: IconFlame, tone: 'accent' },
  request_overdue: { icon: IconInbox, tone: 'danger' },
  request_due_soon: { icon: IconInbox, tone: 'accent' },
  proof_overdue: { icon: IconPaperclip, tone: 'danger' },
  review_overdue: { icon: IconAlertTriangle, tone: 'danger' },
  awaiting_approval: { icon: IconHourglassHigh, tone: 'accent' },
  review_soon: { icon: IconCalendarDue, tone: 'brand' },
};

const MAX_ROWS = 5;

/** The things that most need someone: open breaches, late proof, reviews and requests, requests and policies waiting on a decision, reviews coming up. */
export function AttentionCard({ items }: { items: DashboardAttention[] }) {
  const t = useTranslations('dashboard.attention');

  return (
    <AttentionList
      title={t('title')}
      description={t('description')}
      maxRows={MAX_ROWS}
      clearLabel={t('clear')}
      moreLabel={(count) => t('more', { count })}
      items={items.map((item) => ({
        key: item.key,
        href: item.href,
        title: item.title,
        subtitle: t(`reasons.${item.reason}`, { days: item.days, approver: item.approver }),
        ...LOOK[item.reason],
      }))}
    />
  );
}
