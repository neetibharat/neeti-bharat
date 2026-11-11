'use client';

import { IconSearch } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { useGetAssigneesQuery } from '@/lib/api/control-edit-api';
import { ALL } from '@/lib/filters';
import type { ProofFilters } from '@/lib/proof-query';

/** Search, who collects it, and which rule, above the list. */
export function ProofFilterBar(props: {
  rules: string[];
  filters: ProofFilters;
  onChange: (filters: ProofFilters) => void;
}) {
  const { rules: ruleIds, filters, onChange } = props;
  const t = useTranslations('proofPage');
  const { data } = useGetAssigneesQuery();
  const people = (data?.people ?? []).map((person) => ({ id: person.id, label: person.name }));
  const rules = ruleIds.map((id) => ({ id, label: id }));

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
      <Input
        aria-label={t('search')}
        placeholder={t('search')}
        iconLeading={IconSearch}
        value={filters.search}
        onChange={(search) => onChange({ ...filters, search })}
      />
      <Select
        aria-label={t('columns.assignee')}
        options={[{ id: ALL, label: t('everyone') }, ...people]}
        selectedKey={filters.assigneeId}
        onSelectionChange={(assigneeId) => onChange({ ...filters, assigneeId })}
      />
      <Select
        aria-label={t('filterRule')}
        options={[{ id: ALL, label: t('allRules') }, ...rules]}
        selectedKey={filters.ruleId}
        onSelectionChange={(ruleId) => onChange({ ...filters, ruleId })}
      />
    </div>
  );
}
