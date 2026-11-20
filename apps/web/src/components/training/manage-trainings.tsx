'use client';

import { IconArchive, IconArchiveOff, IconSchool } from '@tabler/icons-react';
import type { TrainingListResponse, TrainingResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Loading } from '@/components/base/loading/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import {
  useAddSuggestedTrainingsMutation,
  useArchiveTrainingMutation,
  useGetTrainingsQuery,
  useRestoreTrainingMutation,
} from '@/lib/api/training-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { EditTrainingButton } from './training-dialogs';

/** Stops asking for a training, or asks again. Nothing is deleted, so it does not ask first. */
function ArchiveButton({ training }: { training: TrainingResponse }) {
  const t = useTranslations('training');
  const [archive, archiving] = useArchiveTrainingMutation();
  const [restore, restoring] = useRestoreTrainingMutation();
  const archived = training.archivedAt !== null;

  return (
    <Button
      color="tertiary"
      size="sm"
      isIconOnly
      iconLeading={archived ? IconArchiveOff : IconArchive}
      isLoading={archiving.isLoading || restoring.isLoading}
      aria-label={t(archived ? 'restore' : 'archive', { name: training.name })}
      onPress={() => void (archived ? restore(training.id) : archive(training.id))}
    />
  );
}

function TrainingRow({ training, people }: { training: TrainingResponse; people: number }) {
  const t = useTranslations('training');
  const archived = training.archivedAt !== null;

  return (
    <TableRow>
      <TableCell>
        <span className="block font-medium text-fg">
          {training.name}
          {training.repeatsYearly && <Badge className="ml-2">{t('yearly')}</Badge>}
        </span>
        {training.about && <span className="block text-label text-fg-muted">{training.about}</span>}
      </TableCell>
      <TableCell className="text-fg-muted tabular-nums">
        {t('doneOf', { done: training.done, total: people })}
      </TableCell>
      <TableCell>
        <Badge color={archived ? 'gray' : 'success'}>{t(archived ? 'archived' : 'inUse')}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          {!archived && <EditTrainingButton training={training} />}
          <ArchiveButton training={training} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function TrainingsTable({ data }: { data: TrainingListResponse }) {
  const t = useTranslations('training.columns');

  return (
    <Table aria-label={t('training')}>
      <TableHeader>
        <TableColumn isRowHeader>{t('training')}</TableColumn>
        <TableColumn>{t('done')}</TableColumn>
        <TableColumn>{t('status')}</TableColumn>
        <TableColumn>
          <span className="sr-only">{t('actions')}</span>
        </TableColumn>
      </TableHeader>
      <TableBody>
        {data.trainings.map((training) => (
          <TrainingRow key={training.id} training={training} people={data.people} />
        ))}
      </TableBody>
    </Table>
  );
}

/** For a company with none, the suggested trainings in one click. */
export function NoTrainings() {
  const t = useTranslations('training.none');
  const [addSuggested, { isLoading }] = useAddSuggestedTrainingsMutation();

  return (
    <EmptyState
      icon={IconSchool}
      title={t('title')}
      description={t('body')}
      action={
        <Button isLoading={isLoading} onPress={() => void addSuggested()}>
          {t('action')}
        </Button>
      }
    />
  );
}

/** The trainings the company asks for, those in use and those archived, with how many people have taken each. Admins only. */
export function ManageTrainings() {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetTrainingsQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;
  if (data.trainings.length === 0) return <NoTrainings />;
  return <TrainingsTable data={data} />;
}
