'use client';

import { APP_ROLES, type AccessLevel, type AppRole } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/base/select/select';

export interface AccessSelectProps {
  value: AccessLevel;
  /** Only a login role can be chosen. */
  onChange: (value: AppRole) => void;
  label?: string;
  isDisabled?: boolean;
  className?: string;
}

/** Picks Admin, Member or Auditor. Someone with no login yet shows "No login yet" until a role is chosen. */
export function AccessSelect({ value, onChange, label, isDisabled, className }: AccessSelectProps) {
  const t = useTranslations('roles');
  const roles = APP_ROLES.map((role) => ({ id: role as AccessLevel, label: t(role) }));
  const options =
    value === 'staff' ? [{ id: 'staff' as AccessLevel, label: t('staff') }, ...roles] : roles;

  return (
    <Select
      aria-label={label ?? t(value)}
      label={label}
      className={className}
      options={options}
      selectedKey={value}
      isDisabled={isDisabled}
      onSelectionChange={(level) => {
        if (level !== 'staff') onChange(level);
      }}
    />
  );
}
