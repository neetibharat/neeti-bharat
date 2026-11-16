'use client';

import type { MyWorkload } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/base/avatar/avatar';
import { Card } from '@/components/base/card/card';
import { Skeleton } from '@/components/base/skeleton/skeleton';
import { Link } from '@/i18n/navigation';
import { useGetMyWorkTeamQuery } from '@/lib/api/my-work-api';
import { useGetPersonOptionsQuery } from '@/lib/api/people-api';

const MAX_ROWS = 6;

interface Row {
  id: string;
  name: string;
  work: MyWorkload;
}

/** Who has the most open work, so it can be shared out. Admins only. */
export function TeamLoadCard() {
  const t = useTranslations('dashboard.team');
  const { data: team } = useGetMyWorkTeamQuery();
  const { data: people } = useGetPersonOptionsQuery();
  if (!team || !people) return <Skeleton className="h-56 rounded-card" />;

  const names = new Map(people.people.map((person) => [person.id, person.name]));
  const rows: Row[] = team.members
    .filter((work) => work.open > 0)
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open)
    .slice(0, MAX_ROWS)
    .map((work) => ({ id: work.personId, name: names.get(work.personId) ?? '', work }));
  const most = Math.max(1, ...rows.map((row) => row.work.open));

  return (
    <Card title={t('title')} description={t('description')}>
      {rows.length === 0 ? (
        <p className="text-body text-fg-muted">{t('clear')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <PersonRow key={row.id} row={row} most={most} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function PersonRow({ row, most }: { row: Row; most: number }) {
  const t = useTranslations('dashboard.team');
  const { work } = row;

  return (
    <li>
      <Link
        href={`/my-work?person=${encodeURIComponent(row.id)}`}
        className="flex items-center gap-3 rounded-control p-1 transition hover:bg-surface-muted/60"
      >
        <Avatar name={row.name} />
        <span className="w-36 shrink-0 truncate text-body font-medium text-fg">{row.name}</span>
        <span className="flex h-2.5 min-w-16 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <span className="h-full bg-danger" style={{ width: `${(work.overdue / most) * 100}%` }} />
          <span
            className="h-full bg-brand"
            style={{ width: `${((work.open - work.overdue) / most) * 100}%` }}
          />
        </span>
        <span className="w-24 shrink-0 text-right text-label text-fg-muted tabular-nums">
          {work.overdue > 0
            ? t('openOverdue', { open: work.open, overdue: work.overdue })
            : t('open', { open: work.open })}
        </span>
      </Link>
    </li>
  );
}
