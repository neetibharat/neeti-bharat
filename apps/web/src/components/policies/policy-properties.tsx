'use client';

import type { PolicyDetailResponse } from '@neeti-bharat/shared';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useCan } from '@/components/providers/user-provider';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { useReviewCadence } from '@/lib/hooks/use-review-cadence';
import { ApproverPicker } from './approver-picker';
import { PolicyStatusBadge } from './policy-status-badge';

/** The wording for the facts that need working out: the version, the last edit and the next review. */
function useFacts(policy: PolicyDetailResponse) {
  const reviewCadence = useReviewCadence();
  const tMeta = useTranslations('policies.document.meta');
  const format = useFormatter();
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' });

  const version =
    policy.version === 0
      ? tMeta('neverApproved')
      : policy.status === 'approved'
        ? tMeta('current', { version: policy.version })
        : tMeta('draftOf', { version: policy.version + 1 });
  const editedWhen = policy.editedAt ? date(policy.editedAt) : null;
  const edited =
    editedWhen && policy.editedByName
      ? tMeta('editedBy', { date: editedWhen, name: policy.editedByName })
      : (editedWhen ?? tMeta('startingText'));
  const review = policy.reviewDueAt ? date(policy.reviewDueAt) : reviewCadence(policy.reviewEvery);

  return { version, edited, review };
}

/** Everything about the policy that is not its text, in one place beside it. */
export function PolicyProperties({ policy }: { policy: PolicyDetailResponse }) {
  const { isAdmin } = useCan();
  const t = useTranslations('policies');
  const tMeta = useTranslations('policies.document.meta');
  const tJobs = useTranslations('jobRoles');
  const facts = useFacts(policy);

  return (
    <Card
      as="aside"
      padding="sm"
      title={t('properties.title')}
      className="self-start lg:sticky lg:top-6"
    >
      <dl className="divide-y divide-line">
        <Row label={tMeta('status')}>
          <PolicyStatusBadge status={policy.status} />
        </Row>
        <Row label={tMeta('version')}>{facts.version}</Row>
        <Row label={t('details.owner')}>{tJobs(policy.ownerRole)}</Row>
        <Row label={t('details.approver')} stacked={isAdmin}>
          {isAdmin ? <ApproverPicker policy={policy} /> : approverName(policy)}
        </Row>
        <Row label={tMeta('edited')}>{facts.edited}</Row>
        <Row label={tMeta('review')}>{facts.review}</Row>
        <LegalReferences references={policy.legalReferences} />
      </dl>
    </Card>
  );
}

const approverName = (policy: PolicyDetailResponse): string =>
  policy.approverPerson?.name ?? policy.approver;

function LegalReferences({ references }: { references: string[] }) {
  const t = useTranslations('policies.details');

  return (
    <div className="py-3">
      <dt className="text-label text-fg-muted">{t('legal')}</dt>
      <dd className="mt-2 flex flex-wrap gap-1.5">
        {references.map((reference) => (
          <Badge key={reference}>{reference}</Badge>
        ))}
      </dd>
    </div>
  );
}

/**
 * A label on the left, its value on the right, so every property lines up the same way. A value that needs room, such
 * as a dropdown with a note under it, is `stacked` beneath its label instead.
 */
function Row(props: { label: string; children: ReactNode; stacked?: boolean }) {
  const { label, children, stacked } = props;

  return (
    <div
      className={
        stacked ? 'flex flex-col gap-2 py-3' : 'flex items-center justify-between gap-4 py-3'
      }
    >
      <dt className="shrink-0 text-label text-fg-muted">{label}</dt>
      <dd
        className={
          stacked
            ? 'min-w-0 text-label font-medium text-fg'
            : 'min-w-0 text-right text-label font-medium text-fg'
        }
      >
        {children}
      </dd>
    </div>
  );
}
