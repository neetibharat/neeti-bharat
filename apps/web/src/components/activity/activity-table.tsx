'use client';

import type { ActivityEventResponse } from '@neeti-bharat/shared';
import { useFormatter, useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { useActivitySentence } from './use-activity-sentence';

export function ActivityTable({ events }: { events: ActivityEventResponse[] }) {
  const t = useTranslations('activity.columns');
  const format = useFormatter();
  const sentence = useActivitySentence();

  return (
    <Table aria-label={t('what')}>
      <TableHeader>
        <TableColumn isRowHeader>{t('when')}</TableColumn>
        <TableColumn>{t('who')}</TableColumn>
        <TableColumn>{t('what')}</TableColumn>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>
              <span className="whitespace-nowrap text-fg-muted">
                {format.dateTime(new Date(event.occurredAt), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </TableCell>
            <TableCell>{event.actorLabel}</TableCell>
            <TableCell>{sentence(event)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
