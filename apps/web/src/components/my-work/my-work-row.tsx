'use client';

import {
  IconAlertTriangle,
  IconFileCheck,
  IconFilePencil,
  IconHourglassHigh,
  IconInbox,
  IconPaperclip,
  type Icon,
} from '@tabler/icons-react';
import type { MyWorkItem, MyWorkKind } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { IconLinkRow, type RowTone } from '@/components/base/icon-link-row/icon-link-row';
import { isBreachStep, isRequestType } from '@/lib/guards';
import { myWorkHref } from '@/lib/my-work-tabs';

const LOOK: Record<MyWorkKind, { icon: Icon; tone: RowTone }> = {
  breach: { icon: IconAlertTriangle, tone: 'danger' },
  request: { icon: IconInbox, tone: 'danger' },
  proof: { icon: IconPaperclip, tone: 'brand' },
  approve: { icon: IconHourglassHigh, tone: 'accent' },
  review: { icon: IconFileCheck, tone: 'success' },
  draft: { icon: IconFilePencil, tone: 'muted' },
};

/** What it belongs to, in words. For a breach that is the step to do next, for a request its type. */
function useItemContext(item: MyWorkItem): string {
  const tSteps = useTranslations('breaches.steps');
  const tTypes = useTranslations('requests.types');
  if (item.kind === 'breach' && isBreachStep(item.context)) return tSteps(item.context);
  if (item.kind === 'request' && isRequestType(item.context)) return tTypes(item.context);
  return item.context;
}

/** One thing to do: what it is, what it belongs to, and when. It opens the breach, the request, the proof or the policy. */
export function MyWorkRow({ item }: { item: MyWorkItem }) {
  const t = useTranslations('dashboard.work');
  const context = useItemContext(item);

  return (
    <IconLinkRow
      href={myWorkHref(item)}
      title={item.title}
      subtitle={`${t(`kinds.${item.kind}`)} · ${context}`}
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
