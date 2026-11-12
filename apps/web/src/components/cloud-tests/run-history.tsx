'use client';

import type { ConnectionRunSummary } from '@dpdp-kit/shared';
import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';
import { Pagination } from '@/components/base/pagination/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { useGetConnectionRunsQuery } from '@/lib/api/connections-api';

function Counts({ run }: { run: ConnectionRunSummary }) {
  const t = useTranslations('connections.history');

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge color="success">{t('passed', { count: run.passed })}</Badge>
      {run.warned > 0 && <Badge color="warning">{t('warned', { count: run.warned })}</Badge>}
      {run.failed > 0 && <Badge color="danger">{t('failed', { count: run.failed })}</Badge>}
    </div>
  );
}

function RunRow({ run, onSelect }: { run: ConnectionRunSummary; onSelect: (id: string) => void }) {
  const t = useTranslations('connections.history');
  const format = useFormatter();

  return (
    <TableRow id={run.id}>
      <TableCell>
        {format.dateTime(new Date(run.ranAt), { dateStyle: 'medium', timeStyle: 'short' })}
      </TableCell>
      <TableCell className="text-fg-muted">{run.ranByName}</TableCell>
      <TableCell>
        <Counts run={run} />
      </TableCell>
      <TableCell>
        <Button color="tertiary" size="sm" onPress={() => onSelect(run.id)}>
          {t('view')}
        </Button>
      </TableCell>
    </TableRow>
  );
}

/** The earlier runs of one connection, a page at a time. "View" shows one above. */
export function RunHistory({
  connectionId,
  onSelect,
}: {
  connectionId: string;
  onSelect: (runId: string) => void;
}) {
  const t = useTranslations('connections.history');
  const [page, setPage] = useState(1);
  const { data } = useGetConnectionRunsQuery({ id: connectionId, page });
  if (!data || data.total < 2) return null;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-subtitle font-semibold text-fg">{t('title')}</h3>
      <Table aria-label={t('title')}>
        <TableHeader>
          <TableColumn isRowHeader>{t('checked')}</TableColumn>
          <TableColumn className="w-40">{t('by')}</TableColumn>
          <TableColumn className="w-64">{t('result')}</TableColumn>
          <TableColumn className="w-24">{null}</TableColumn>
        </TableHeader>
        <TableBody>
          {data.items.map((run) => (
            <RunRow key={run.id} run={run} onSelect={onSelect} />
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={setPage}
      />
    </section>
  );
}
