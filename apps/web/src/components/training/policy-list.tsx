'use client';

import { IconCheck } from '@tabler/icons-react';
import type { PolicyAcceptanceItem } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';
import { Link } from '@/i18n/navigation';
import { useAcceptPolicyMutation } from '@/lib/api/policy-acceptance-api';
import { cx } from '@/lib/utils/cx';
import { useDay } from './training-list';

const TONE = { todo: 'gray', accepted: 'success', changed: 'warning' } as const;

/** What to say under a policy: when it was accepted, or that it changed since. */
function Note({ item }: { item: PolicyAcceptanceItem }) {
  const t = useTranslations('training.policies');
  const dayOf = useDay();
  if (item.status === 'accepted' && item.acceptedOn) {
    return (
      <span className="text-label text-fg-muted">
        {t('accepted', { date: dayOf(item.acceptedOn) })}
      </span>
    );
  }
  if (item.status === 'changed') {
    return (
      <span className="text-label text-accent">
        {t('changed', { date: dayOf(item.approvedOn) })}
      </span>
    );
  }
  return (
    <span className="text-label text-fg-muted">
      {t('approvedOn', { date: dayOf(item.approvedOn) })}
    </span>
  );
}

/** Reads the policy, and accepts it when it is the signed-in person's own list. */
function Actions({ item, canAct }: { item: PolicyAcceptanceItem; canAct: boolean }) {
  const t = useTranslations('training.policies');
  const [accept, { isLoading }] = useAcceptPolicyMutation();

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/policies/${encodeURIComponent(item.policyId)}`}
        className="rounded-control px-2 py-1 text-label font-semibold text-brand hover:bg-brand-soft"
      >
        {t('open')}
      </Link>
      {canAct && item.status !== 'accepted' && (
        <Button size="sm" isLoading={isLoading} onPress={() => void accept(item.policyId)}>
          {t('accept')}
        </Button>
      )}
    </div>
  );
}

function Row({ item, canAct }: { item: PolicyAcceptanceItem; canAct: boolean }) {
  const t = useTranslations('training.policies');
  const done = item.status === 'accepted';

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-card border border-line/70 bg-surface p-4 shadow-card">
      <span
        aria-hidden
        className={cx(
          'grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-inset',
          done ? 'bg-success text-surface ring-success' : 'bg-surface ring-line-strong',
        )}
      >
        {done && <IconCheck className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-fg">
          {item.title}
          <Badge color={TONE[item.status]}>{t(`status.${item.status}`)}</Badge>
        </p>
        <p className="text-label text-fg-muted">{item.summary}</p>
        <Note item={item} />
      </div>
      <Actions item={item} canAct={canAct} />
    </li>
  );
}

/** The approved policies, each with where one person stands. `canAct` lets the signed-in person accept their own. */
export function PolicyList({ items, canAct }: { items: PolicyAcceptanceItem[]; canAct: boolean }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <Row key={item.policyId} item={item} canAct={canAct} />
      ))}
    </ul>
  );
}
