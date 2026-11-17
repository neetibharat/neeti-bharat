'use client';

import { isLocked, type FrameworkResponse, type RuleResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useCan } from '@/components/providers/user-provider';
import { Card } from '@/components/base/card/card';
import { AddRuleButton } from './add-rule-button';
import { RuleTable } from './rule-table';

/**
 * The rules of a framework, with a way to add one, and an empty framework says what to do first. A locked built-in
 * framework's rules are fixed.
 */
export function RulesTab(props: { framework: FrameworkResponse; rules: RuleResponse[] }) {
  const { framework, rules } = props;
  const { canEdit } = useCan();
  const t = useTranslations('frameworks.rulesTab');
  const canAdd = canEdit && !isLocked(framework.isBuiltIn);
  if (rules.length === 0) {
    return (
      <Card variant="dashed" className="flex flex-col items-start gap-3">
        <p className="text-subtitle font-semibold text-fg">{t('emptyTitle')}</p>
        <p className="max-w-xl text-body text-fg-muted">{t('emptyText')}</p>
        {canAdd && <AddRuleButton frameworkId={framework.id} />}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canAdd && (
        <div className="flex justify-end">
          <AddRuleButton frameworkId={framework.id} />
        </div>
      )}
      <RuleTable rules={rules} />
    </div>
  );
}
