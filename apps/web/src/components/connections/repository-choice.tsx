'use client';

import { IconSearch } from '@tabler/icons-react';
import type { GithubRepositoryOption, GithubSelection } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import { SegmentedControl } from '@/components/base/segmented-control/segmented-control';
import { matchingRepositories, toggled, withAll, withoutAll } from '@/lib/github-selection';

type Mode = GithubSelection['mode'];

/** The search, and a way to tick or clear every repository that is shown. */
function Toolbar({
  query,
  onQuery,
  onSelectShown,
  onClearShown,
}: {
  query: string;
  onQuery: (query: string) => void;
  onSelectShown: () => void;
  onClearShown: () => void;
}) {
  const t = useTranslations('connections.repositories');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label={t('search')}
        placeholder={t('search')}
        iconLeading={IconSearch}
        value={query}
        onChange={onQuery}
        className="min-w-0 flex-1"
      />
      <Button color="secondary" size="sm" onPress={onSelectShown}>
        {t('selectAll')}
      </Button>
      <Button color="secondary" size="sm" onPress={onClearShown}>
        {t('clear')}
      </Button>
    </div>
  );
}

function Rows({
  shown,
  picked,
  onPicked,
}: {
  shown: GithubRepositoryOption[];
  picked: string[];
  onPicked: (picked: string[]) => void;
}) {
  const t = useTranslations('connections.repositories');

  return (
    <ul className="flex max-h-60 flex-col divide-y divide-line overflow-y-auto rounded-control border border-line">
      {shown.length === 0 && <li className="px-3 py-2 text-label text-fg-muted">{t('noMatch')}</li>}
      {shown.map((repository) => (
        <li key={repository.name} className="flex items-center justify-between gap-3 px-3 py-2">
          <Checkbox
            isSelected={picked.includes(repository.name)}
            onChange={() => onPicked(toggled(picked, repository.name))}
          >
            <span className="min-w-0 truncate font-mono text-label">{repository.name}</span>
          </Checkbox>
          {repository.isPrivate && <Badge>{t('private')}</Badge>}
        </li>
      ))}
    </ul>
  );
}

/** The repositories to tick, with a search and a count of how many are ticked. */
function RepositoryList({
  repositories,
  picked,
  onPicked,
}: {
  repositories: GithubRepositoryOption[];
  picked: string[];
  onPicked: (picked: string[]) => void;
}) {
  const t = useTranslations('connections.repositories');
  const [query, setQuery] = useState('');
  const shown = matchingRepositories(repositories, query);
  const names = shown.map((repository) => repository.name);

  return (
    <div className="flex flex-col gap-2">
      <Toolbar
        query={query}
        onQuery={setQuery}
        onSelectShown={() => onPicked(withAll(picked, names))}
        onClearShown={() => onPicked(withoutAll(picked, names))}
      />
      <Rows shown={shown} picked={picked} onPicked={onPicked} />
      <p className="text-label text-fg-muted">
        {t('count', { count: picked.length, total: repositories.length })}
      </p>
    </div>
  );
}

/** All repositories, or only the ticked ones. */
export function RepositoryChoice({
  repositories,
  value,
  onChange,
}: {
  repositories: GithubRepositoryOption[];
  value: GithubSelection;
  onChange: (selection: GithubSelection) => void;
}) {
  const t = useTranslations('connections.repositories');

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label font-semibold text-fg">{t('label')}</p>
      <SegmentedControl<Mode>
        aria-label={t('label')}
        className="self-start"
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode })}
        options={[
          { id: 'all', label: t('all') },
          { id: 'selected', label: t('selected') },
        ]}
      />
      {value.mode === 'all' ? (
        <p className="text-label text-fg-muted">{t('allHint')}</p>
      ) : (
        <>
          <p className="text-label text-fg-muted">{t('pickHint')}</p>
          <RepositoryList
            repositories={repositories}
            picked={value.repositories}
            onPicked={(picked) => onChange({ ...value, repositories: picked })}
          />
        </>
      )}
    </div>
  );
}
