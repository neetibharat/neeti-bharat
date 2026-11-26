'use client';

import { IconExternalLink } from '@tabler/icons-react';
import type { FlaggedResource, FoundValue } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';

/** A setting as the system wrote it. One that is not set at all says so. */
function Value({ value }: { value: FoundValue }) {
  const t = useTranslations('cloudTests.finding');
  if (value === null || value === '') return <span className="italic">{t('notSet')}</span>;
  return <span className="text-fg">{String(value)}</span>;
}

/** The region and resource group, and a link to the resource in its own system. */
function Place({ resource }: { resource: FlaggedResource }) {
  const t = useTranslations('cloudTests.finding');
  const group = resource.group ? t('group', { group: resource.group }) : undefined;
  const place = [resource.location, group].filter(Boolean).join(' · ');
  if (!place && !resource.url) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {place && <span>{place}</span>}
      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand underline-offset-2 hover:underline"
        >
          {t('open')}
          <IconExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </div>
  );
}

/** The settings that made the check flag it, under the system's own names. */
function Seen({ found }: { found: [string, FoundValue][] }) {
  const t = useTranslations('cloudTests.finding');
  if (found.length === 0) return null;

  return (
    <dl
      aria-label={t('seen')}
      className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5 font-mono"
    >
      {found.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="truncate">{key}</dt>
          <dd className="min-w-0 wrap-break-word">
            <Value value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Where a flagged resource is, a link to it in its own system, and the settings that made the check flag it. */
export function ResourceFacts({ resource }: { resource: FlaggedResource }) {
  return (
    <div className="flex flex-col gap-1 text-label text-fg-muted">
      <Place resource={resource} />
      <Seen found={Object.entries(resource.found ?? {})} />
    </div>
  );
}
