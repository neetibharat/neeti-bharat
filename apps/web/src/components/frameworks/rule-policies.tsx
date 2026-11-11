'use client';

import type { PolicyResponse, RuleResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { PolicyStatusBadge } from '@/components/policies/policy-status-badge';
import { Link } from '@/i18n/navigation';
import { approverOf } from '@/lib/policy-filter';

/** How many of this rule's controls a policy answers. */
const coveredBy = (rule: RuleResponse, policy: PolicyResponse): number =>
  rule.controls.filter((control) => control.policies.some((p) => p.id === policy.id)).length;

/** The policies behind this rule. A title opens the policy, which is where it is written and approved. */
export function RulePolicies({
  rule,
  policies,
}: {
  rule: RuleResponse;
  policies: PolicyResponse[];
}) {
  const t = useTranslations('frameworks.rulePage.policies');
  if (policies.length === 0) return <p className="text-body text-fg-muted">{t('empty')}</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label text-fg-muted">{t('hint')}</p>
      <Table aria-label={t('title')}>
        <TableHeader>
          <TableColumn isRowHeader>{t('columns.policy')}</TableColumn>
          <TableColumn className="w-32">{t('columns.status')}</TableColumn>
          <TableColumn className="w-40">{t('columns.owner')}</TableColumn>
          <TableColumn className="w-52">{t('columns.approver')}</TableColumn>
          <TableColumn className="w-32">{t('columns.covers')}</TableColumn>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <PolicyRow key={policy.id} rule={rule} policy={policy} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PolicyRow({ rule, policy }: { rule: RuleResponse; policy: PolicyResponse }) {
  const t = useTranslations('frameworks.rulePage.policies');
  const tJobs = useTranslations('jobRoles');

  return (
    <TableRow id={policy.id}>
      <TableCell className="font-medium">
        <Link href={`/policies/${policy.id}`} className="hover:text-brand hover:underline">
          {policy.id} · {policy.title}
        </Link>
      </TableCell>
      <TableCell>
        <PolicyStatusBadge status={policy.status} />
      </TableCell>
      <TableCell className="text-fg-muted">{tJobs(policy.ownerRole)}</TableCell>
      <TableCell className="text-fg-muted">{approverOf(policy)}</TableCell>
      <TableCell className="text-fg-muted tabular-nums">
        {t('coversCount', { count: coveredBy(rule, policy), total: rule.controls.length })}
      </TableCell>
    </TableRow>
  );
}
