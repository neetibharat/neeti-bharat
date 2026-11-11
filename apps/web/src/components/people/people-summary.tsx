'use client';

import type { PeopleCounts } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { StatTile } from '@/components/base/stat-tile/stat-tile';
import { useGetMyWorkTeamQuery } from '@/lib/api/my-work-api';
import { useGetRoleHoldersQuery } from '@/lib/api/people-api';

/** Four numbers on top: how many people, who can sign in, how many roles have a holder, and how much work is late. */
export function PeopleSummary({ counts }: { counts?: PeopleCounts }) {
  const t = useTranslations('people.summary');
  const { data: roles } = useGetRoleHoldersQuery();
  const { data: team } = useGetMyWorkTeamQuery();
  if (!counts || !roles) return null;

  const holders = roles.roleHolders;
  const filled = holders.filter((holder) => holder.personId).length;
  const overdue = (team?.members ?? []).reduce((sum, member) => sum + member.overdue, 0);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile
        label={t('people')}
        value={String(counts.active)}
        note={t('peopleNote', { count: counts.left })}
      />
      <StatTile
        label={t('login')}
        value={String(counts.withLogin)}
        note={t('loginNote', { count: Math.max(0, counts.active - counts.withLogin) })}
      />
      <StatTile
        label={t('roles')}
        value={`${filled}/${holders.length}`}
        note={t('rolesNote', { count: holders.length - filled })}
      />
      <StatTile
        label={t('overdue')}
        value={String(overdue)}
        note={t('overdueNote')}
        tone={overdue > 0 ? 'danger' : 'neutral'}
      />
    </div>
  );
}
