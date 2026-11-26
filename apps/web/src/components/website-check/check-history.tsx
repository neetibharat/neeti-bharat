'use client';

import type { WebsiteCheckSummary } from '@neeti-bharat/shared';
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
import { useGetWebsiteChecksQuery } from '@/lib/api/website-check-api';

function Counts({ run }: { run: WebsiteCheckSummary }) {
  const t = useTranslations('websiteCheck.history');

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge color="success">{t('passed', { count: run.passed })}</Badge>
      {run.warned > 0 && <Badge color="warning">{t('warned', { count: run.warned })}</Badge>}
      {run.failed > 0 && <Badge color="danger">{t('failed', { count: run.failed })}</Badge>}
    </div>
  );
}

function RunRow({ run, onSelect }: { run: WebsiteCheckSummary; onSelect: (id: string) => void }) {
  const t = useTranslations('websiteCheck.history');
  const format = useFormatter();

  return (
    <TableRow id={run.id}>
      <TableCell className="font-medium">{run.url}</TableCell>
      <TableCell className="text-fg-muted">
        {format.dateTime(new Date(run.checkedAt), { dateStyle: 'medium', timeStyle: 'short' })}
      </TableCell>
      <TableCell className="text-fg-muted">{run.checkedByName}</TableCell>
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

export interface CheckHistoryProps {
  page: number;
  onPage: (page: number) => void;
  onSelect: (id: string) => void;
}

/** The earlier checks, a page at a time. "View" shows one above. */
export function CheckHistory({ page, onPage, onSelect }: CheckHistoryProps) {
  const t = useTranslations('websiteCheck.history');
  const { data } = useGetWebsiteChecksQuery(page);
  if (!data?.items.length) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-subtitle font-semibold text-fg">{t('title')}</h2>
      <Table aria-label={t('title')}>
        <TableHeader>
          <TableColumn isRowHeader>{t('address')}</TableColumn>
          <TableColumn className="w-48">{t('checked')}</TableColumn>
          <TableColumn className="w-40">{t('by')}</TableColumn>
          <TableColumn className="w-72">{t('result')}</TableColumn>
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
        onPageChange={onPage}
      />
    </section>
  );
}
