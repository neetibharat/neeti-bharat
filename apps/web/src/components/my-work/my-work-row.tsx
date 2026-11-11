'use client';

import {
  IconFileCheck,
  IconFilePencil,
  IconHourglassHigh,
  IconPaperclip,
  type Icon,
} from '@tabler/icons-react';
import type { MyWorkItem, MyWorkKind } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { IconLinkRow, type RowTone } from '@/components/base/icon-link-row/icon-link-row';
import { myWorkHref } from '@/lib/my-work-tabs';

const LOOK: Record<MyWorkKind, { icon: Icon; tone: RowTone }> = {
  proof: { icon: IconPaperclip, tone: 'brand' },
  approve: { icon: IconHourglassHigh, tone: 'accent' },
  review: { icon: IconFileCheck, tone: 'success' },
  draft: { icon: IconFilePencil, tone: 'muted' },
};

/** One thing to do: what it is, what it belongs to, and when. It opens the proof or the policy. */
export function MyWorkRow({ item }: { item: MyWorkItem }) {
  const t = useTranslations('dashboard.work');

  return (
    <IconLinkRow
      href={myWorkHref(item)}
      title={item.title}
      subtitle={`${t(`kinds.${item.kind}`)} · ${item.context}`}
      trailing={<DueLabel item={item} />}
      {...LOOK[item.kind]}
    />
  );
}

function DueLabel({ item }: { item: MyWorkItem }) {
  const t = useTranslations('dashboard.work');
  const format = useFormatter();
  if (!item.dueOn) return null;
  const date = format.dateTime(new Date(item.dueOn), { dateStyle: 'medium' });

  return item.overdue ? (
    <Badge color="danger">{t('overdue', { date })}</Badge>
  ) : (
    <span className="shrink-0 text-label text-fg-muted">{t('due', { date })}</span>
  );
}
