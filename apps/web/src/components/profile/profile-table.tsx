'use client';

import type { ProfileEntryResponse, ProfileGroup } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';
import { Badge } from '@/components/base/badge/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { EditEntryButton } from './edit-entry-button';
import { RemoveEntryButton } from './remove-entry-button';
import { useEntryText } from './use-entry-text';

type Group = ProfileGroup | 'custom';

/** The answers, grouped under a heading row each. `groups` is the order to show them in. */
export function ProfileTable({
  entries,
  groups,
}: {
  entries: ProfileEntryResponse[];
  groups: Group[];
}) {
  const t = useTranslations('profile.columns');

  const rows = groups.flatMap((group) => {
    const inGroup = entries.filter((entry) => entry.group === group);
    if (!inGroup.length) return [];
    return [
      <GroupRow key={`group-${group}`} group={group} />,
      ...inGroup.map((entry) => <EntryRow key={entry.key} entry={entry} />),
    ];
  });

  return (
    <Table aria-label={t('question')}>
      <TableHeader>
        <TableColumn isRowHeader className="w-[45%]">
          {t('question')}
        </TableColumn>
        <TableColumn>{t('answer')}</TableColumn>
        <TableColumn className="w-28 text-right">{t('actions')}</TableColumn>
      </TableHeader>
      <TableBody>{rows}</TableBody>
    </Table>
  );
}

function GroupRow({ group }: { group: Group }): ReactElement {
  const t = useTranslations('profile');
  return (
    <TableRow className="bg-surface-sunken/60 hover:bg-surface-sunken/60">
      <TableCell colSpan={3} className="py-2">
        <span className="flex flex-wrap items-center gap-2 text-label font-semibold text-fg">
          {t(`groups.${group}`)}
          {group === 'legalLimits' && <Badge color="brand">{t('fromRules')}</Badge>}
        </span>
        {group === 'legalLimits' && (
          <span className="mt-0.5 block text-caption font-normal text-fg-muted">
            {t('legalNote')}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function EntryRow({ entry }: { entry: ProfileEntryResponse }): ReactElement {
  const text = useEntryText();
  const hint = text.hint(entry);
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{text.label(entry)}</p>
        {hint && <p className="mt-0.5 text-caption text-fg-subtle">{hint}</p>}
      </TableCell>
      <TableCell>
        <AnswerCell entry={entry} />
      </TableCell>
      <TableCell>
        {/* Each button has a slot of its own, so the pencils line up down the column whether or not a row can be removed. */}
        <div className="flex justify-end gap-1">
          <span className="size-8">{!entry.isDerived && <EditEntryButton entry={entry} />}</span>
          <span className="size-8">{entry.isCustom && <RemoveEntryButton entry={entry} />}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AnswerCell({ entry }: { entry: ProfileEntryResponse }) {
  const t = useTranslations('profile');
  if (entry.value === '') return <Badge color="warning">{t('notAnswered')}</Badge>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="break-words">
        {entry.kind === 'yesNo' ? t(entry.value === 'yes' ? 'yes' : 'no') : entry.value}
      </span>
      {entry.isDerived && <Badge color="brand">{t('fromRole')}</Badge>}
    </div>
  );
}
