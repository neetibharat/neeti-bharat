'use client';

import type { BreachListItem } from '@neeti-bharat/shared';
import { useFormatter, useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { Link } from '@/i18n/navigation';
import { useNow } from '@/lib/hooks/use-now';
import { BreachClockBadge } from './breach-clock-badge';
import { BreachStepBadge } from './breach-step-badge';

function Head() {
  const t = useTranslations('breaches.columns');

  return (
    <TableHeader>
      <TableColumn isRowHeader>{t('title')}</TableColumn>
      <TableColumn className="w-44">{t('found')}</TableColumn>
      <TableColumn className="w-36">{t('people')}</TableColumn>
      <TableColumn className="w-40">{t('step')}</TableColumn>
      <TableColumn className="w-44">{t('clock')}</TableColumn>
      <TableColumn className="w-40">{t('assignee')}</TableColumn>
    </TableHeader>
  );
}

function BreachRow({ breach, now }: { breach: BreachListItem; now: Date }) {
  const t = useTranslations('breaches');
  const format = useFormatter();

  return (
    <TableRow id={breach.id}>
      <TableCell className="font-medium">
        <Link href={`/breaches/${breach.id}`} className="text-fg hover:text-brand hover:underline">
          {breach.title}
        </Link>
      </TableCell>
      <TableCell className="text-fg-muted">
        {format.dateTime(new Date(breach.foundAt), { dateStyle: 'medium', timeStyle: 'short' })}
      </TableCell>
      <TableCell className="text-fg-muted tabular-nums">
        {breach.peopleAffected ?? t('unknownPeople')}
      </TableCell>
      <TableCell>
        <BreachStepBadge step={breach.currentStep} />
      </TableCell>
      <TableCell>
        <BreachClockBadge
          reportDueAt={breach.reportDueAt}
          currentStep={breach.currentStep}
          now={now}
        />
      </TableCell>
      <TableCell className={breach.assigneeName ? 'text-fg' : 'text-fg-subtle'}>
        {breach.assigneeName ?? t('unassigned')}
      </TableCell>
    </TableRow>
  );
}

/** The breaches on one page. A title opens that breach. */
export function BreachesTable({ breaches }: { breaches: BreachListItem[] }) {
  const t = useTranslations('breaches.columns');
  const now = useNow();

  return (
    <Table aria-label={t('title')}>
      <Head />
      <TableBody>
        {breaches.map((breach) => (
          <BreachRow key={breach.id} breach={breach} now={now} />
        ))}
      </TableBody>
    </Table>
  );
}
