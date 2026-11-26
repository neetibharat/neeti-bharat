'use client';

import { IconSearch, IconX } from '@tabler/icons-react';
import type { PolicyResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { ALL } from '@/lib/filters';
import {
  NO_POLICY_FILTERS,
  approversIn,
  isFiltered,
  type PolicyFilters,
} from '@/lib/policy-filter';

interface BarProps {
  policies: PolicyResponse[];
  filters: PolicyFilters;
  onChange: (filters: PolicyFilters) => void;
}

/** Search, who owns the policy, and who approves it, with a way to clear them all. */
export function PolicyFilterBar(props: BarProps) {
  const { filters, onChange } = props;
  const t = useTranslations('policies');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        aria-label={t('search')}
        placeholder={t('search')}
        value={filters.search}
        onChange={(search) => onChange({ ...filters, search })}
        iconLeading={IconSearch}
        className="w-full sm:w-72"
      />
      <PeopleSelects {...props} />
      {isFiltered(filters) && (
        <Button color="tertiary" iconLeading={IconX} onPress={() => onChange(NO_POLICY_FILTERS)}>
          {t('clearFilters')}
        </Button>
      )}
    </div>
  );
}

/** The owner and approver choices, built from the people who actually appear in the list. */
function PeopleSelects({ policies, filters, onChange }: BarProps) {
  const t = useTranslations('policies');
  const tJobs = useTranslations('jobRoles');
  const owners = [...new Set(policies.map((policy) => policy.ownerRole))].map((role) => ({
    id: role,
    label: tJobs(role),
  }));
  const approvers = approversIn(policies).map((name) => ({ id: name, label: name }));

  return (
    <>
      <Select
        aria-label={t('columns.owner')}
        className="w-full sm:w-52"
        options={[{ id: ALL, label: t('allOwners') }, ...owners]}
        selectedKey={filters.owner}
        onSelectionChange={(owner) => onChange({ ...filters, owner })}
      />
      <Select
        aria-label={t('columns.approver')}
        className="w-full sm:w-60"
        options={[{ id: ALL, label: t('allApprovers') }, ...approvers]}
        selectedKey={filters.approver}
        onSelectionChange={(approver) => onChange({ ...filters, approver })}
      />
    </>
  );
}
