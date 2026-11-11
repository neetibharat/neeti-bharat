'use client';

import { Select } from '@/components/base/select/select';
import { useGetAssigneesQuery } from '@/lib/api/control-edit-api';

const NOBODY = 'nobody';

/** Picks one of the people who work here, or nobody. */
export function AssigneeSelect(props: {
  label: string;
  /** What choosing nobody means, in words. */
  noneLabel: string;
  value: string | null;
  onChange: (id: string | null) => void;
  isDisabled?: boolean;
}) {
  const { data } = useGetAssigneesQuery();
  const people = (data?.people ?? []).map((person) => ({ id: person.id, label: person.name }));

  return (
    <Select
      label={props.label}
      isDisabled={props.isDisabled}
      options={[{ id: NOBODY, label: props.noneLabel }, ...people]}
      selectedKey={props.value ?? NOBODY}
      onSelectionChange={(key) => props.onChange(key === NOBODY ? null : key)}
    />
  );
}
