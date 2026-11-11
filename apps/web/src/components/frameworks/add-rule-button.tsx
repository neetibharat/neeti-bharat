'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useCreateRuleMutation } from '@/lib/api/framework-edit-api';
import { NEW_RULE, RuleForm } from './rule-form';

/** Adds a rule to a framework of the company's own. */
export function AddRuleButton({ frameworkId }: { frameworkId: string }) {
  const t = useTranslations('frameworks.ruleActions');

  return (
    <Modal
      size="lg"
      trigger={
        <Button color="secondary" iconLeading={IconPlus}>
          {t('add')}
        </Button>
      }
      title={t('add')}
      description={t('addHint')}
    >
      {(close) => <Adding frameworkId={frameworkId} onDone={close} />}
    </Modal>
  );
}

function Adding({ frameworkId, onDone }: { frameworkId: string; onDone: () => void }) {
  const t = useTranslations('frameworks.ruleForm');
  const [create, { isLoading, error }] = useCreateRuleMutation();

  return (
    <RuleForm
      initial={NEW_RULE}
      submitLabel={t('create')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await create({ frameworkId, ...values });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
