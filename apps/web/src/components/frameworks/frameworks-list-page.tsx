'use client';

import type { FrameworkSummaryResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useCan } from '@/components/providers/user-provider';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Loading } from '@/components/base/loading/loading';
import { PageHeader } from '@/components/base/page-header/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { Link } from '@/i18n/navigation';
import { useGetFrameworksQuery } from '@/lib/api/frameworks-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { percentOf } from '@/lib/percent';
import { AddFrameworkButton } from './add-framework-button';
import { FrameworkSeal } from './framework-seal';
import { ReadinessBar } from './readiness-bar';

type Other = 'iso' | 'soc';
const OTHERS: Other[] = ['iso', 'soc'];

/** The frameworks you follow. The ones that are on their way are listed after them. */
export function FrameworksListPage() {
  const { canEdit } = useCan();
  const tPage = useTranslations('pages.frameworks');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetFrameworksQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader
        title={tPage('title')}
        description={tPage('description')}
        actions={canEdit ? <AddFrameworkButton /> : undefined}
      />
      <FrameworksTable frameworks={data.frameworks} />
    </>
  );
}

function FrameworksTable({ frameworks }: { frameworks: FrameworkSummaryResponse[] }) {
  const t = useTranslations('frameworks.list');

  return (
    <Table aria-label={t('framework')}>
      <TableHeader>
        <TableColumn isRowHeader>{t('framework')}</TableColumn>
        <TableColumn className="w-48">{t('readiness')}</TableColumn>
        <TableColumn className="w-52">{t('requirements')}</TableColumn>
        <TableColumn className="w-36">{t('status')}</TableColumn>
      </TableHeader>
      <TableBody>
        {frameworks.map((framework) => (
          <FrameworkRow key={framework.id} framework={framework} />
        ))}
        {OTHERS.map((other) => (
          <OtherRow key={other} other={other} />
        ))}
      </TableBody>
    </Table>
  );
}

function FrameworkRow({ framework }: { framework: FrameworkSummaryResponse }) {
  const t = useTranslations('frameworks.list');

  return (
    <TableRow id={framework.id}>
      <TableCell>
        <Link
          href={`/frameworks/${encodeURIComponent(framework.id)}`}
          className="block rounded-control outline-none focus-visible:focus-ring"
        >
          <FrameworkName seal={framework.seal} name={framework.name} about={framework.about} />
        </Link>
      </TableCell>
      <TableCell>
        <ReadinessBar
          percent={percentOf(framework.controlsDone, framework.controlsTotal)}
          label={framework.name}
        />
      </TableCell>
      <TableCell className="text-fg-muted">
        {t('count', { done: framework.controlsDone, total: framework.controlsTotal })}
      </TableCell>
      <TableCell>
        <Badge color="brand">{framework.isBuiltIn ? t('builtIn') : t('custom')}</Badge>
      </TableCell>
    </TableRow>
  );
}

function OtherRow({ other }: { other: Other }) {
  const t = useTranslations('frameworks.list');

  return (
    <TableRow id={other}>
      <TableCell>
        <FrameworkName
          muted
          seal={t(`${other}.seal`)}
          name={t(`${other}.name`)}
          about={t(`${other}.about`)}
        />
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell>
        <Badge>{t('soon')}</Badge>
      </TableCell>
    </TableRow>
  );
}

interface FrameworkNameProps {
  seal: string;
  name: string;
  about: string;
  muted?: boolean;
}

function FrameworkName({ seal, name, about, muted }: FrameworkNameProps) {
  return (
    <div className="flex items-center gap-3">
      <FrameworkSeal name={seal} muted={muted} />
      <div className="min-w-0">
        <p className="font-medium text-fg">{name}</p>
        <p className="text-label text-fg-muted">{about}</p>
      </div>
    </div>
  );
}
