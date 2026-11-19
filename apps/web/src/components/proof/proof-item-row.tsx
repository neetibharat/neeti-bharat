'use client';

import type { ProofItemResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { ProofStatusBadge } from '@/components/proof/proof-status-badge';
import { Link } from '@/i18n/navigation';
import { isJobRole } from '@/lib/guards';

/** Who collects it: the person named on the requirement, or else the job that owns the control. */
function useCollector(item: ProofItemResponse): string {
  const t = useTranslations('proofPage');
  const tJobs = useTranslations('jobRoles');
  if (item.assigneeName) return item.assigneeName;
  return isJobRole(item.ownerRole) ? tJobs(item.ownerRole) : (item.ownerName ?? t('nobody'));
}

/** One requirement as a line under its control: its title, then who, how often and when, and where it stands. */
export function ProofItemRow({ item }: { item: ProofItemResponse }) {
  const t = useTranslations('proofPage');
  const tProof = useTranslations('frameworks.proof');
  const format = useFormatter();
  const collector = useCollector(item);
  const due = item.dueOn
    ? format.dateTime(new Date(item.dueOn), { dateStyle: 'medium' })
    : t('noDate');

  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <Link
          href={`/proof/${item.id}`}
          className="text-body text-fg hover:text-brand hover:underline"
        >
          {item.title}
        </Link>
        <p className="text-label text-fg-muted">
          {collector} · {tProof(`frequencies.${item.frequency}`)} · {due}
        </p>
      </div>
      <span className="flex shrink-0 flex-wrap justify-end gap-1">
        <ProofStatusBadge status={item.status} />
        {item.overdue && <Badge color="danger">{t('overdueBadge')}</Badge>}
      </span>
    </li>
  );
}
