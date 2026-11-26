'use client';

import { type JobRole, type RoleHolderResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { Select } from '@/components/base/select/select';
import {
  useAssignRoleMutation,
  useGetPersonOptionsQuery,
  useGetRoleHoldersQuery,
} from '@/lib/api/people-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { cx } from '@/lib/utils/cx';

const VACANT = 'vacant';

/** One tile per job role, with its holder and a picker. A role nobody holds is marked, so gaps stand out. */
export function RoleHoldersCard() {
  const t = useTranslations('people.roleHolders');
  const errorMessage = useErrorMessage();
  const [assign, { error }] = useAssignRoleMutation();
  const { data: holders } = useGetRoleHoldersQuery();
  const { data: people } = useGetPersonOptionsQuery();
  if (!holders || !people) return null;
  const options = [
    { id: VACANT, label: t('vacant') },
    ...people.people.map((person) => ({ id: person.id, label: person.name })),
  ];

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {holders.roleHolders.map((holder) => (
          <RoleTile
            key={holder.role}
            holder={holder}
            options={options}
            onChange={(personId) => void assign({ role: holder.role, personId })}
          />
        ))}
      </div>
      {error && (
        <Alert tone="error" className="mt-3">
          {errorMessage(error)}
        </Alert>
      )}
    </Card>
  );
}

interface RoleTileProps {
  holder: RoleHolderResponse;
  options: { id: string; label: string }[];
  onChange: (personId: string | null) => void;
}

function RoleTile({ holder, options, onChange }: RoleTileProps) {
  const t = useTranslations('people.roleHolders');
  const tRoles = useTranslations('jobRoles');
  const label = tRoles(holder.role as JobRole);

  return (
    <div
      className={cx(
        'flex flex-col gap-3 rounded-control border p-4',
        holder.personId ? 'border-line' : 'border-dashed border-line-strong bg-surface-muted/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-label font-semibold text-fg">{label}</p>
        {!holder.personId && <Badge color="warning">{t('vacant')}</Badge>}
      </div>
      <Select
        aria-label={label}
        options={options}
        selectedKey={holder.personId ?? VACANT}
        onSelectionChange={(key) => onChange(key === VACANT ? null : key)}
      />
      {holder.role === 'DPO' && <p className="text-caption text-fg-subtle">{t('dpoNote')}</p>}
    </div>
  );
}
