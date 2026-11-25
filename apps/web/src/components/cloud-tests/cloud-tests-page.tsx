'use client';

import { IconCloudCheck } from '@tabler/icons-react';
import { CONNECTION_MAX_PAGE_SIZE, type ConnectionSummary } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Loading } from '@/components/base/loading/loading';
import { Select } from '@/components/base/select/select';
import { Tabs } from '@/components/base/tabs/tabs';
import { useCan } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetConnectionsQuery } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { EditConnectionButton } from '@/components/connections/edit-connection-button';
import { GroupsControl } from './groups-control';
import { RunButton } from './run-button';
import { RunHistory } from './run-history';
import { ScheduleControl } from './schedule-control';
import { ScanResults } from './scan-results';

type TabId = 'results' | 'history';

function NoConnections() {
  const t = useTranslations('cloudTests.empty');

  return (
    <Card variant="dashed">
      <EmptyState
        icon={IconCloudCheck}
        title={t('title')}
        description={t('body')}
        action={
          <Link href="/connections" className="text-label font-medium text-brand hover:underline">
            {t('link')}
          </Link>
        }
      />
    </Card>
  );
}

function NotRunYet() {
  const t = useTranslations('cloudTests.notRunYet');
  const { canEdit } = useCan();

  return (
    <Card variant="dashed">
      <EmptyState
        icon={IconCloudCheck}
        title={t('title')}
        description={t(canEdit ? 'canRun' : 'readOnly')}
      />
    </Card>
  );
}

/** The results of the connection's latest run, or one chosen from its history, and the history itself. */
function Scan({
  connection,
  runId,
  onSelect,
}: {
  connection: ConnectionSummary;
  runId: string | undefined;
  onSelect: (runId: string) => void;
}) {
  const t = useTranslations('cloudTests.tabs');
  const [tab, setTab] = useState<TabId>('results');
  // Kept across runs of the same account, so what is open and filtered stays put after running a check again.
  const results = runId ? (
    <ScanResults key={connection.id} runId={runId} onRan={onSelect} />
  ) : (
    <NotRunYet />
  );

  return (
    <Tabs<TabId>
      selectedKey={tab}
      onSelectionChange={setTab}
      tabs={[
        { id: 'results', label: t('results'), content: results },
        {
          id: 'history',
          label: t('history'),
          content: (
            <RunHistory
              connectionId={connection.id}
              onSelect={(id) => {
                onSelect(id);
                setTab('results');
              }}
            />
          ),
        },
      ]}
    />
  );
}

/** Which account, and beside it how often it is checked without anyone asking. */
function Account({
  connections,
  connection,
  onPick,
}: {
  connections: ConnectionSummary[];
  connection: ConnectionSummary;
  onPick: (id: string) => void;
}) {
  const t = useTranslations('cloudTests');
  const { isAdmin } = useCan();

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
      {connections.length > 1 ? (
        <Select
          label={t('account')}
          selectedKey={connection.id}
          onSelectionChange={onPick}
          options={connections.map((item) => ({ id: item.id, label: item.name }))}
          className="w-full max-w-xs"
        />
      ) : (
        <h2 className="text-subtitle font-semibold text-fg">{connection.name}</h2>
      )}
      <ScheduleControl connection={connection} canChange={isAdmin} />
      <GroupsControl connection={connection} canChange={isAdmin} />
    </div>
  );
}

/** The account on the left, and on the right the button that checks it now. */
function Toolbar({
  connections,
  connection,
  onPick,
  onRan,
}: {
  connections: ConnectionSummary[];
  connection: ConnectionSummary;
  onPick: (id: string) => void;
  onRan: (runId: string) => void;
}) {
  const { canEdit, isAdmin } = useCan();

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <Account connections={connections} connection={connection} onPick={onPick} />
      {canEdit && (
        <RunButton
          id={connection.id}
          onRan={onRan}
          leading={isAdmin && <EditConnectionButton connection={connection} size="md" />}
        />
      )}
    </div>
  );
}

/** Which account is shown, taken from the address if it names one, and which run of it. */
function useChosen(connections: ConnectionSummary[]) {
  const [picked, setPicked] = useState<string | null>(useSearchParams().get('connection'));
  const [shown, setShown] = useState<Record<string, string>>({});
  const connection = connections.find((item) => item.id === picked) ?? connections[0];

  return {
    connection,
    setPicked,
    runId: connection && (shown[connection.id] ?? connection.lastRun?.id),
    show: (runId: string) => connection && setShown({ ...shown, [connection.id]: runId }),
  };
}

function Loaded({ connections }: { connections: ConnectionSummary[] }) {
  const t = useTranslations('cloudTests');
  const { connection, setPicked, runId, show } = useChosen(connections);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="flex flex-col gap-6">
        {connection ? (
          <>
            <Toolbar
              connections={connections}
              connection={connection}
              onPick={setPicked}
              onRan={show}
            />
            <Scan connection={connection} runId={runId} onSelect={show} />
          </>
        ) : (
          <NoConnections />
        )}
      </div>
    </>
  );
}

/** How the connected cloud accounts compare with what the Act expects, one account at a time. */
export function CloudTestsPage() {
  const errorMessage = useErrorMessage();
  const { data, error } = useGetConnectionsQuery({
    page: 1,
    limit: CONNECTION_MAX_PAGE_SIZE,
  });

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  return <Loaded connections={data.items} />;
}
