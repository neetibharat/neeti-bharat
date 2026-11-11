'use client';

import { IconEye, IconId, IconShieldLock, IconUserCheck, type Icon } from '@tabler/icons-react';
import { ACCESS_LEVELS, type AccessLevel } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';

const ICONS: Record<AccessLevel, Icon> = {
  admin: IconShieldLock,
  member: IconUserCheck,
  auditor: IconEye,
  staff: IconId,
};

/** What each access level means, so nobody has to guess before choosing one. */
export function AccessLevelsCard() {
  const t = useTranslations('people.accessLevels');

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACCESS_LEVELS.map((level) => (
          <LevelTile key={level} level={level} />
        ))}
      </div>
    </Card>
  );
}

function LevelTile({ level }: { level: AccessLevel }) {
  const t = useTranslations('people.accessLevels');
  const tRoles = useTranslations('roles');
  const LevelIcon = ICONS[level];
  const canSignIn = level !== 'staff';

  return (
    <div className="flex flex-col gap-3 rounded-control border border-line bg-surface p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <LevelIcon className="size-5" stroke={1.75} />
        </span>
        <h3 className="text-subtitle font-semibold text-fg">{tRoles(level)}</h3>
      </div>
      <p className="flex-1 text-body text-fg-muted">{t(level)}</p>
      <div>
        <Badge color={canSignIn ? 'success' : 'gray'}>
          {t(canSignIn ? 'canSignIn' : 'noLogin')}
        </Badge>
      </div>
    </div>
  );
}
