'use client';

import { IconSearch } from '@tabler/icons-react';
import {
  CHECK_GROUPS,
  CHECK_SEVERITIES,
  type ConnectionCheckResult,
  type ConnectionRunResponse,
} from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { HeroFact, HeroFacts } from '@/components/base/hero-panel/hero-panel';
import { Input } from '@/components/base/input/input';
import { SegmentedControl } from '@/components/base/segmented-control/segmented-control';
import { useGetConnectionRunQuery } from '@/lib/api/connections-api';
import { countBySeverity, visibleResults, type SeverityFilter } from '@/lib/cloud-tests';
import { inView, needsAttention, type ResultView } from '@/lib/connections';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { Finding } from './finding';
import { RecheckButton } from './recheck-button';

type Words = (key: string, values?: Record<string, string | number>) => string;

/** Every group of every provider. A run holds the results of one, and a group none of them fall in is left out. */
const ALL_GROUPS = Object.values(CHECK_GROUPS).flat();

/** Who made the run and when, and for a run of only some checks, how many it read again. */
function useRunLine(run: ConnectionRunResponse): string {
  const t = useTranslations('connections.results');
  const format = useFormatter();
  const values = {
    when: format.dateTime(new Date(run.ranAt), { dateStyle: 'medium', timeStyle: 'short' }),
    name: run.ranByName,
  };
  if (run.rechecked.length > 0) return t('rechecked', { ...values, count: run.rechecked.length });
  return t(run.bySchedule ? 'checkedBySchedule' : 'checked', values);
}

/** When the run was made and by whom, and how many checks ended each way. */
function Summary({ run }: { run: ConnectionRunResponse }) {
  const t = useTranslations('connections.results');

  return (
    <Card description={useRunLine(run)}>
      <HeroFacts>
        <HeroFact label={t('passed')} value={String(run.passed)} dot="bg-success" />
        <HeroFact label={t('warned')} value={String(run.warned)} dot="bg-accent" />
        <HeroFact
          label={t('failed')}
          value={String(run.failed)}
          dot="bg-danger"
          isAlert={run.failed > 0}
        />
        <HeroFact label={t('skipped')} value={String(run.skipped)} dot="bg-line-strong" />
      </HeroFacts>
    </Card>
  );
}

interface GroupsProps {
  results: ConnectionCheckResult[];
  connectionId: string;
  onRan: (runId: string) => void;
}

/** A group's title and what it covers, and beside them the button that runs the checks shown in it again. */
function GroupHeader({ id, results, connectionId, onRan }: GroupsProps & { id: string }) {
  const t = useTranslations('connections.groups') as unknown as Words;
  const recheck = useTranslations('cloudTests.recheck');

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-subtitle font-semibold text-fg">{t(`${id}.title`)}</h3>
        <p className="text-label text-fg-muted">{t(`${id}.about`)}</p>
      </div>
      <RecheckButton
        connectionId={connectionId}
        checks={results.map((result) => result.id)}
        label={recheck('group', { count: results.length })}
        onRan={onRan}
      />
    </div>
  );
}

function Groups({ results, connectionId, onRan }: GroupsProps) {
  const filters = useTranslations('cloudTests.filters');
  const groups = ALL_GROUPS.map((group) => ({
    id: group.id,
    found: results.filter((result) => (group.checks as readonly string[]).includes(result.id)),
  })).filter(({ found }) => found.length > 0);

  if (groups.length === 0) return <Alert tone="info">{filters('noMatches')}</Alert>;
  return (
    <>
      {groups.map(({ id, found }) => (
        <section key={id} className="flex flex-col gap-2">
          <GroupHeader id={id} results={found} connectionId={connectionId} onRan={onRan} />
          {found.map((result) => (
            <Finding key={result.id} result={result} connectionId={connectionId} onRan={onRan} />
          ))}
        </section>
      ))}
    </>
  );
}

function ViewChoice({
  results,
  view,
  onView,
}: {
  results: ConnectionCheckResult[];
  view: ResultView;
  onView: (view: ResultView) => void;
}) {
  const t = useTranslations('connections.results');

  return (
    <SegmentedControl<ResultView>
      aria-label={t('view.label')}
      value={view}
      onChange={onView}
      options={[
        {
          id: 'attention',
          label: t('view.attention', { count: results.filter(needsAttention).length }),
        },
        { id: 'all', label: t('view.all', { count: results.length }) },
      ]}
    />
  );
}

function SeverityChoice({
  results,
  severity,
  onSeverity,
}: {
  results: ConnectionCheckResult[];
  severity: SeverityFilter;
  onSeverity: (severity: SeverityFilter) => void;
}) {
  const t = useTranslations('cloudTests.filters');
  const counts = countBySeverity(results);

  return (
    <SegmentedControl<SeverityFilter>
      aria-label={t('severity')}
      value={severity}
      onChange={onSeverity}
      options={[
        { id: 'all', label: t('all', { count: results.length }) },
        ...CHECK_SEVERITIES.map((level) => ({
          id: level,
          label: t(level, { count: counts[level] }),
        })),
      ]}
    />
  );
}

interface FiltersProps {
  results: ConnectionCheckResult[];
  view: ResultView;
  onView: (view: ResultView) => void;
  severity: SeverityFilter;
  onSeverity: (severity: SeverityFilter) => void;
  query: string;
  onQuery: (query: string) => void;
}

/** What to show: needs attention or all, one severity, and a search, with the counts each choice would give. */
function Filters(props: FiltersProps) {
  const t = useTranslations('cloudTests.filters');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <ViewChoice results={props.results} view={props.view} onView={props.onView} />
        <SeverityChoice
          results={inView(props.results, props.view)}
          severity={props.severity}
          onSeverity={props.onSeverity}
        />
      </div>
      <Input
        aria-label={t('search')}
        placeholder={t('search')}
        iconLeading={IconSearch}
        value={props.query}
        onChange={props.onQuery}
        className="max-w-sm"
      />
    </div>
  );
}

/**
 * One run of the checks: the totals, filters, and every finding, grouped, each opening to its detail. `onRan` shows the
 * run made by running some checks again.
 */
export function ScanResults({ runId, onRan }: { runId: string; onRan: (runId: string) => void }) {
  const errorMessage = useErrorMessage();
  const check = useTranslations('connections') as unknown as Words;
  const { data, error } = useGetConnectionRunQuery(runId);
  const [chosen, setChosen] = useState<ResultView | null>(null);
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [query, setQuery] = useState('');

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return null;
  const attention = data.results.filter(needsAttention).length;
  // What needs a look comes first, unless there is nothing, when the whole list is the more useful thing to see.
  const view = chosen ?? (attention > 0 ? 'attention' : 'all');
  const needle = query.trim().toLowerCase();
  const shown = visibleResults(data.results, {
    view,
    severity,
    matches: (id) =>
      needle === '' ||
      check(`checks.${id}.name`).toLowerCase().includes(needle) ||
      check(`checks.${id}.about`).toLowerCase().includes(needle),
  });

  return (
    <div className="flex flex-col gap-6">
      <Summary run={data} />
      <Filters
        results={data.results}
        view={view}
        onView={setChosen}
        severity={severity}
        onSeverity={setSeverity}
        query={query}
        onQuery={setQuery}
      />
      <Groups results={shown} connectionId={data.connectionId} onRan={onRan} />
    </div>
  );
}
