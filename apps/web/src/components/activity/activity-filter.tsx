'use client';

import { ACTIVITY_ACTIONS, type ActivityAction } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Select, type SelectOption } from '@/components/base/select/select';
import { ALL } from '@/lib/filters';

export type ActivityFilterValue = ActivityAction | typeof ALL;

export interface ActivityFilterProps {
  value: ActivityFilterValue;
  onChange: (value: ActivityFilterValue) => void;
}

/** Narrows the log to one kind of change. */
export function ActivityFilter({ value, onChange }: ActivityFilterProps) {
  const t = useTranslations('activity');
  const options: SelectOption<ActivityFilterValue>[] = [
    { id: ALL, label: t('allActions') },
    ...ACTIVITY_ACTIONS.map((action) => ({ id: action, label: t(`actionNames.${action}`) })),
  ];

  return (
    <Select
      label={t('filterLabel')}
      className="w-56"
      options={options}
      selectedKey={value}
      onSelectionChange={onChange}
    />
  );
}
