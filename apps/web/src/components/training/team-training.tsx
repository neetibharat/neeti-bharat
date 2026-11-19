'use client';

import { IconSearch } from '@tabler/icons-react';
import {
  TRAINING_PAGE_SIZE,
  type TeamPoliciesResponse,
  type TeamPolicyRow,
  type TeamTrainingResponse,
  type TeamTrainingRow,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Input } from '@/components/base/input/input';
import { Loading } from '@/components/base/loading/loading';
import { Pagination } from '@/components/base/pagination/pagination';
import { ProgressBar } from '@/components/base/progress-bar/progress-bar';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { Link } from '@/i18n/navigation';
import { useGetTeamPoliciesQuery } from '@/lib/api/policy-acceptance-api';
import { useGetTeamTrainingQuery } from '@/lib/api/training-api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { progressOf } from '@/lib/training';

const TONE = { complete: 'success', started: 'warning', not_started: 'gray' } as const;

/** One progress bar, in green once everything is done. */
function Progress(props: { label: string; done: number; total: number; text: string }) {
  const { done, total } = props;
  return (
    <ProgressBar
      label={props.label}
      value={total === 0 ? 0 : (done / total) * 100}
      valueText={props.text}
      tone={progressOf(done, total) === 'complete' ? 'success' : 'brand'}
    />
  );
}

function PersonRow(props: { row: TeamTrainingRow; policies?: TeamPolicyRow }) {
  const t = useTranslations('training.team');
  const { row, policies } = props;
  const progress = progressOf(row.done, row.total);

  return (
    <TableRow>
      <TableCell>
        <Link href={`/settings/people/${row.personId}`} className="block hover:underline">
          <span className="block font-medium text-fg">{row.name}</span>
          <span className="block text-label text-fg-muted">{row.email}</span>
        </Link>
      </TableCell>
      <TableCell>
        <Progress
          label={row.name}
          done={row.done}
          total={row.total}
          text={t('doneOf', { done: row.done, total: row.total })}
        />
      </TableCell>
      <TableCell>
        {policies && (
          <Progress
            label={row.name}
            done={policies.accepted}
            total={policies.total}
            text={t('policiesOf', { done: policies.accepted, total: policies.total })}
          />
        )}
      </TableCell>
      <TableCell>
        <Badge color={TONE[progress]}>{t(`status.${progress}`)}</Badge>
      </TableCell>
    </TableRow>
  );
}

function PeopleTable(props: {
  data: TeamTrainingResponse;
  policies?: TeamPoliciesResponse;
  onPage: (page: number) => void;
}) {
  const t = useTranslations('training.team');
  const { data, policies } = props;
  const byPerson = new Map(policies?.people.map((row) => [row.personId, row]));

  return (
    <>
      <Table aria-label={t('person')}>
        <TableHeader>
          <TableColumn isRowHeader>{t('person')}</TableColumn>
          <TableColumn>{t('trainingColumn')}</TableColumn>
          <TableColumn>{t('policiesColumn')}</TableColumn>
          <TableColumn>{t('state')}</TableColumn>
        </TableHeader>
        <TableBody>
          {data.people.map((row) => (
            <PersonRow key={row.personId} row={row} policies={byPerson.get(row.personId)} />
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={props.onPage}
      />
    </>
  );
}

/** The sentences above the table: how many people have done all the training, and accepted every policy. */
function Summary(props: { data: TeamTrainingResponse; policies?: TeamPoliciesResponse }) {
  const t = useTranslations('training.team');
  const { data, policies } = props;

  return (
    <div className="flex flex-col gap-1 text-body text-fg-muted">
      <p>
        {data.trainings === 0
          ? t('noTrainings')
          : t('summary', { trained: data.trained, everyone: data.everyone })}
      </p>
      {policies && policies.policies > 0 && (
        <p>{t('policiesSummary', { accepted: policies.accepted, everyone: policies.everyone })}</p>
      )}
    </div>
  );
}

/** How far each person has got with training and with accepting policies. For admins and auditors. */
export function TeamTraining() {
  const t = useTranslations('training.team');
  const errorMessage = useErrorMessage();
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(text.trim());
  const params = { q: q || undefined, page, limit: TRAINING_PAGE_SIZE };
  const { data, error } = useGetTeamTrainingQuery(params);
  const { data: policies } = useGetTeamPoliciesQuery(params);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <div className="flex flex-col gap-4">
      <Summary data={data} policies={policies} />
      <Input
        aria-label={t('search')}
        placeholder={t('search')}
        iconLeading={IconSearch}
        value={text}
        onChange={(value) => {
          setText(value);
          setPage(1);
        }}
        className="max-w-sm"
      />
      {data.people.length === 0 ? (
        <p className="py-6 text-center text-body text-fg-muted">{t('noMatch')}</p>
      ) : (
        <PeopleTable data={data} policies={policies} onPage={setPage} />
      )}
    </div>
  );
}
