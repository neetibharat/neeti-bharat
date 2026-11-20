'use client';

import type { DeadlineItem } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { IconLinkRow } from '@/components/base/icon-link-row/icon-link-row';
import { useWorkContext, WORK_LOOK } from '@/components/my-work/my-work-row';
import { deadlineLabel } from '@/lib/deadline-label';
import { myWorkHref } from '@/lib/my-work-tabs';

/** One dated job: what it is, who has it, and how long is left or how late it is. It opens the thing itself. */
export function DeadlineRow({ item, now }: { item: DeadlineItem; now: Date }) {
  const t = useTranslations('deadlines');
  const tKind = useTranslations('dashboard.work.kinds');
  const format = useFormatter();
  const context = useWorkContext(item);
  const label = deadlineLabel(item.dueOn, now);
  const text = t(`${label.group}.${label.unit}`, { count: label.count });
  const owner = item.assigneeName ? t('owner', { name: item.assigneeName }) : t('unassigned');

  return (
    <IconLinkRow
      href={myWorkHref(item)}
      title={item.title}
      subtitle={`${tKind(item.kind)} · ${context} · ${owner}`}
      trailing={
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          {label.group === 'late' ? (
            <Badge color="danger">{text}</Badge>
          ) : (
            <span className="text-label font-medium text-fg">{text}</span>
          )}
          <span className="text-caption text-fg-muted">
            {format.dateTime(new Date(item.dueOn), { dateStyle: 'medium' })}
          </span>
        </span>
      }
      {...WORK_LOOK[item.kind]}
    />
  );
}
