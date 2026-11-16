'use client';

import { IconChevronRight } from '@tabler/icons-react';
import type { RuleResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Badge } from '@/components/base/badge/badge';
import { Link } from '@/i18n/navigation';
import { cx } from '@/lib/utils/cx';
import { policyIdsOf, progressOf, ruleHeading, type RuleStatus } from '@/lib/rule-progress';
import { ReadinessBar } from './readiness-bar';

type RowStatus = RuleStatus | 'off';
const STATUS_COLOR: Record<RowStatus, 'gray' | 'warning' | 'success'> = {
  off: 'gray',
  notStarted: 'gray',
  inProgress: 'warning',
  done: 'success',
};
const POLICIES_SHOWN = 3;
const COLUMNS =
  'grid items-center gap-4 px-5 lg:grid-cols-[minmax(0,1fr)_11rem_5rem_12rem_7rem_1.25rem]';

/** Every rule, one row each. A row opens that rule's own page. */
export function RuleTable({ rules }: { rules: RuleResponse[] }) {
  const t = useTranslations('frameworks.rules');

  return (
    <div className="overflow-hidden rounded-card border border-line/70 bg-surface shadow-card">
      <div
        className={`${COLUMNS} border-b border-line bg-surface-sunken py-2.5 text-caption font-semibold tracking-wide text-fg-muted uppercase max-lg:hidden`}
      >
        <span>{t('rule')}</span>
        <span>{t('readiness')}</span>
        <span>{t('controls')}</span>
        <span>{t('policies')}</span>
        <span>{t('status')}</span>
        <span />
      </div>
      <ul>
        {rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} />
        ))}
      </ul>
    </div>
  );
}

/** A rule that applies is a link. One that does not is shown dimmed and cannot be opened. */
function RowShell({ rule, children }: { rule: RuleResponse; children: ReactNode }) {
  const base = `${COLUMNS} w-full py-3.5 text-left`;
  if (!rule.applies) return <div className={cx(base, 'cursor-default opacity-60')}>{children}</div>;

  return (
    <Link
      href={`/frameworks/${encodeURIComponent(rule.frameworkId)}/rules/${encodeURIComponent(rule.id)}`}
      className={cx(base, 'group outline-none hover:bg-surface-muted focus-visible:focus-ring')}
    >
      {children}
    </Link>
  );
}

function RuleRow({ rule }: { rule: RuleResponse }) {
  const t = useTranslations('frameworks');
  const progress = progressOf(rule.controls);
  const status: RowStatus = rule.applies ? progress.status : 'off';

  return (
    <li className="border-t border-line first:border-t-0">
      <RowShell rule={rule}>
        <span className="min-w-0">
          <span className="block font-medium text-fg">{ruleHeading(rule)}</span>
          <span className="mt-0.5 block truncate text-label text-fg-muted">{rule.summary}</span>
        </span>
        <ReadinessBar percent={progress.percent} label={rule.title} className="max-lg:hidden" />
        <span className="text-fg-muted tabular-nums max-lg:hidden">
          {t('rules.count', { done: progress.done, total: progress.total })}
        </span>
        <PolicyChips ids={policyIdsOf(rule)} />
        <span>
          <Badge color={STATUS_COLOR[status]}>{t(`ruleStatus.${status}`)}</Badge>
        </span>
        <IconChevronRight className="size-5 text-fg-subtle transition-transform group-hover:translate-x-0.5 max-lg:hidden" />
      </RowShell>
    </li>
  );
}

function PolicyChips({ ids }: { ids: string[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 max-lg:hidden">
      {ids.slice(0, POLICIES_SHOWN).map((id) => (
        <Badge key={id}>{id}</Badge>
      ))}
      {ids.length > POLICIES_SHOWN && (
        <span className="text-caption text-fg-subtle">+{ids.length - POLICIES_SHOWN}</span>
      )}
    </span>
  );
}
