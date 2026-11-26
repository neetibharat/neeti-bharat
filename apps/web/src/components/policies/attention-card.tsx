'use client';

import {
  IconAlertTriangle,
  IconCalendarDue,
  IconChevronRight,
  IconHourglassHigh,
  IconPencil,
  type Icon,
} from '@tabler/icons-react';
import { policyLabel, type PolicyResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { AttentionList } from '@/components/base/attention-list/attention-list';
import type { RowTone } from '@/components/base/icon-link-row/icon-link-row';
import { Link } from '@/i18n/navigation';
import { attentionItems, nextDrafts, type AttentionReason } from '@/lib/policy-attention';
import { approverOf } from '@/lib/policy-filter';

const LOOK: Record<AttentionReason, { icon: Icon; tone: RowTone }> = {
  review_overdue: { icon: IconAlertTriangle, tone: 'danger' },
  awaiting_approval: { icon: IconHourglassHigh, tone: 'accent' },
  review_soon: { icon: IconCalendarDue, tone: 'brand' },
};

const MAX_ROWS = 4;
const MAX_SUGGESTIONS = 3;

/** What needs doing on this page right now: reviews overdue, policies waiting for approval, and what to write next. */
export function AttentionCard({ policies }: { policies: PolicyResponse[] }) {
  const t = useTranslations('policies.attention');
  const items = attentionItems(policies);
  const shown = Math.min(items.length, MAX_ROWS);
  const drafts = nextDrafts(policies, Math.min(MAX_SUGGESTIONS, Math.max(1, MAX_ROWS - shown)));

  return (
    <AttentionList
      title={t('title')}
      description={t('description')}
      maxRows={MAX_ROWS}
      clearLabel={t('clear')}
      moreLabel={(count) => t('more', { count })}
      items={items.map((item) => ({
        key: item.policy.id,
        href: `/policies/${item.policy.id}`,
        title: policyLabel(item.policy),
        subtitle: t(`reasons.${item.reason}`, {
          days: item.days,
          approver: approverOf(item.policy),
        }),
        ...LOOK[item.reason],
      }))}
    >
      {drafts.length > 0 && <Suggestions drafts={drafts} />}
    </AttentionList>
  );
}

function Suggestions({ drafts }: { drafts: PolicyResponse[] }) {
  const t = useTranslations('policies.attention');

  return (
    <div>
      <p className="mb-2 text-caption font-semibold tracking-wider text-brand uppercase">
        {t('next')}
      </p>
      <ul className="flex flex-col gap-2">
        {drafts.map((policy) => (
          <li key={policy.id}>
            <Link
              href={`/policies/${policy.id}`}
              className="group flex items-center gap-3 rounded-control border border-dashed border-brand-line bg-brand-soft/40 px-3 py-2.5 transition hover:bg-brand-soft"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-brand shadow-xs">
                <IconPencil className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-fg">
                  {policyLabel(policy)}
                </span>
                <span className="block truncate text-label text-fg-muted">{policy.summary}</span>
              </span>
              <IconChevronRight className="size-4 shrink-0 text-brand transition group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
