'use client';

import { ACCESS_LEVELS, type AccessLevel } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/base/select/select';

export interface AccessSelectProps {
  value: AccessLevel;
  onChange: (value: AccessLevel) => void;
  label?: string;
  isDisabled?: boolean;
  className?: string;
}

/** Picks Admin, Member, Auditor or Staff (no login). */
export function AccessSelect({ value, onChange, label, isDisabled, className }: AccessSelectProps) {
  const t = useTranslations('roles');
  const options = ACCESS_LEVELS.map((level) => ({ id: level, label: t(level) }));

  return (
    <Select
      aria-label={label ?? t(value)}
      label={label}
      className={className}
      options={options}
      selectedKey={value}
      isDisabled={isDisabled}
      onSelectionChange={onChange}
    />
  );
}
