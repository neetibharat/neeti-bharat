'use client';

import type { PolicyDetailResponse } from '@neeti-bharat/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { PolicyStatusBadge } from './policy-status-badge';
import { PolicyVersionButton } from './policy-version-button';

type Format = (iso: string) => string;

/** Where the policy stands: who approved it and when, when it is next due, and every approved version. */
export function PolicyApprovalCard({ state }: { state: PolicyDetailResponse }) {
  const t = useTranslations('policies.approval');
  const format = useFormatter();
  const date: Format = (iso) => format.dateTime(new Date(iso), { dateStyle: 'medium' });

  return (
    <Card title={t('title')}>
      <div className="flex flex-wrap items-center gap-3">
        <PolicyStatusBadge status={state.status} />
        <Standing state={state} date={date} />
        <ReviewDue dueAt={state.reviewDueAt} date={date} />
      </div>
      {state.status === 'in_review' && state.changelog && (
        <p className="mt-3 text-body text-fg-muted">{t('changelog', { text: state.changelog })}</p>
      )}
      {state.approvals.length > 0 && (
        <History policyId={state.id} approvals={state.approvals} date={date} />
      )}
    </Card>
  );
}

function Standing({ state, date }: { state: PolicyDetailResponse; date: Format }) {
  const t = useTranslations('policies.approval');
  if (state.approvedAt && state.approvedByName) {
    return (
      <p className="text-body text-fg-muted">
        {t('approvedBy', { name: state.approvedByName, date: date(state.approvedAt) })}
      </p>
    );
  }
  return (
    <p className="text-body text-fg-muted">
      {t(state.status === 'in_review' ? 'waiting' : 'notApproved')}
    </p>
  );
}

function ReviewDue({ dueAt, date }: { dueAt: string | null; date: Format }) {
  const t = useTranslations('policies.approval');
  if (!dueAt) return null;
  const overdue = new Date(dueAt) < new Date();

  return (
    <p className={overdue ? 'text-body text-danger' : 'text-body text-fg-muted'}>
      {t(overdue ? 'overdue' : 'reviewDue', { date: date(dueAt) })}
    </p>
  );
}

interface HistoryProps {
  policyId: string;
  approvals: PolicyDetailResponse['approvals'];
  date: Format;
}

function History({ policyId, approvals, date }: HistoryProps) {
  const t = useTranslations('policies.approval');

  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="text-caption font-semibold tracking-wide text-fg-muted uppercase">
        {t('history')}
      </h3>
      <ul className="mt-2 divide-y divide-line">
        {approvals.map((approval) => (
          <li
            key={approval.version}
            className="flex items-center justify-between gap-3 py-2 text-body"
          >
            <span className="min-w-0">
              <span className="font-medium text-fg">
                {t('version', { version: approval.version })}
              </span>
              <span className="text-fg-muted">
                {' · '}
                {approval.approvedByName}
                {' · '}
                {date(approval.approvedAt)}
              </span>
              {approval.changelog && (
                <span className="mt-0.5 block text-label text-fg-subtle">{approval.changelog}</span>
              )}
            </span>
            <PolicyVersionButton policyId={policyId} version={approval} />
          </li>
        ))}
      </ul>
    </div>
  );
}
