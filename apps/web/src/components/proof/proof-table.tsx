'use client';

import type { ProofItemResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { ProofStatusBadge } from '@/components/proof/proof-status-badge';
import { Link } from '@/i18n/navigation';
import { isJobRole } from '@/lib/guards';

/** The proof items as a table. A title opens that requirement's own page. */
export function ProofTable({ items }: { items: ProofItemResponse[] }) {
  const t = useTranslations('proofPage');
  if (!items.length) return <p className="text-body text-fg-muted">{t('empty')}</p>;

  return (
    <Table aria-label={t('columns.proof')}>
      <TableHeader>
        <TableColumn isRowHeader>{t('columns.proof')}</TableColumn>
        <TableColumn className="w-56">{t('columns.control')}</TableColumn>
        <TableColumn className="w-44">{t('columns.assignee')}</TableColumn>
        <TableColumn className="w-32">{t('columns.frequency')}</TableColumn>
        <TableColumn className="w-44">{t('columns.status')}</TableColumn>
        <TableColumn className="w-32">{t('columns.due')}</TableColumn>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <ProofRow key={item.id} item={item} />
        ))}
      </TableBody>
    </Table>
  );
}

function ProofRow({ item }: { item: ProofItemResponse }) {
  const t = useTranslations('proofPage');
  const tProof = useTranslations('frameworks.proof');
  const format = useFormatter();
  const due = item.dueOn
    ? format.dateTime(new Date(item.dueOn), { dateStyle: 'medium' })
    : t('noDate');

  return (
    <TableRow id={item.id}>
      <TableCell className="font-medium">
        <Link href={`/proof/${item.id}`} className="text-fg hover:text-brand hover:underline">
          {item.title}
        </Link>
      </TableCell>
      <TableCell>
        <p className="text-label text-fg">{item.controlTitle}</p>
        <Badge className="mt-1">{item.ruleId}</Badge>
      </TableCell>
      <TableCell>
        <Collector item={item} />
      </TableCell>
      <TableCell className="text-fg-muted">{tProof(`frequencies.${item.frequency}`)}</TableCell>
      <TableCell>
        <span className="flex flex-wrap gap-1">
          <ProofStatusBadge status={item.status} />
          {item.overdue && <Badge color="danger">{t('overdueBadge')}</Badge>}
        </span>
      </TableCell>
      <TableCell className={item.overdue ? 'text-danger' : 'text-fg-muted'}>{due}</TableCell>
    </TableRow>
  );
}

/** Who collects it: the person named on the requirement, or else whoever owns the control. */
function Collector({ item }: { item: ProofItemResponse }) {
  const t = useTranslations('proofPage');
  const tJobs = useTranslations('jobRoles');
  if (item.assigneeName) return <p className="text-label text-fg">{item.assigneeName}</p>;

  return (
    <>
      <p className="text-label text-fg-muted">
        {isJobRole(item.ownerRole) ? tJobs(item.ownerRole) : item.ownerRole}
      </p>
      <p className="text-caption text-fg-subtle">{item.ownerName ?? t('nobody')}</p>
    </>
  );
}
