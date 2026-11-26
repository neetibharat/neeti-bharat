'use client';

import { requestRef, type RequestListItem } from '@neeti-bharat/shared';
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
import { RequestDueBadge } from './request-due-badge';
import { RequestTypeBadge } from './request-type-badge';

function Head() {
  const t = useTranslations('requests.columns');

  return (
    <TableHeader>
      <TableColumn className="w-24">{t('ref')}</TableColumn>
      <TableColumn isRowHeader>{t('person')}</TableColumn>
      <TableColumn className="w-40">{t('type')}</TableColumn>
      <TableColumn className="w-36">{t('received')}</TableColumn>
      <TableColumn className="w-56">{t('due')}</TableColumn>
      <TableColumn className="w-28">{t('tasks')}</TableColumn>
      <TableColumn className="w-40">{t('assignee')}</TableColumn>
    </TableHeader>
  );
}

function DueCell({ request, now }: { request: RequestListItem; now: Date }) {
  const format = useFormatter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-fg-muted">
        {format.dateTime(new Date(request.dueAt), { dateStyle: 'medium' })}
      </span>
      <RequestDueBadge status={request.status} dueAt={request.dueAt} now={now} />
    </div>
  );
}

function Progress({ request }: { request: RequestListItem }) {
  const t = useTranslations('requests');
  if (request.tasksTotal === 0) return <span className="text-fg-subtle">{t('noTasks')}</span>;
  return t('progress', { done: request.tasksDone, total: request.tasksTotal });
}

function RequestRow({ request, now }: { request: RequestListItem; now: Date }) {
  const format = useFormatter();
  const t = useTranslations('requests');

  return (
    <TableRow id={request.id}>
      <TableCell className="text-fg-muted tabular-nums">{requestRef(request.number)}</TableCell>
      <TableCell className="font-medium">
        <Link href={`/requests/${request.id}`} className="text-fg hover:text-brand hover:underline">
          {request.personName}
        </Link>
      </TableCell>
      <TableCell>
        <RequestTypeBadge type={request.type} />
      </TableCell>
      <TableCell className="text-fg-muted">
        {format.dateTime(new Date(request.receivedAt), { dateStyle: 'medium' })}
      </TableCell>
      <TableCell>
        <DueCell request={request} now={now} />
      </TableCell>
      <TableCell className="text-fg-muted tabular-nums">
        <Progress request={request} />
      </TableCell>
      <TableCell className={request.assigneeName ? 'text-fg' : 'text-fg-subtle'}>
        {request.assigneeName ?? t('unassigned')}
      </TableCell>
    </TableRow>
  );
}

/** The requests on one page. A name opens that request. */
export function RequestsTable({ requests }: { requests: RequestListItem[] }) {
  const t = useTranslations('requests.columns');
  const now = useNow();

  return (
    <Table aria-label={t('person')}>
      <Head />
      <TableBody>
        {requests.map((request) => (
          <RequestRow key={request.id} request={request} now={now} />
        ))}
      </TableBody>
    </Table>
  );
}
