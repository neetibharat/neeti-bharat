'use client';

import { IconArchive, IconPencil } from '@tabler/icons-react';
import type { RuleResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { Modal } from '@/components/base/modal/modal';
import { useRouter } from '@/i18n/navigation';
import { useArchiveRuleMutation, useUpdateRuleMutation } from '@/lib/api/framework-edit-api';
import { RuleForm } from './rule-form';

/** Change or archive a rule the company added. A built-in framework's rules have neither. */
export function RuleActions({ rule }: { rule: RuleResponse }) {
  const t = useTranslations('frameworks.ruleActions');
  const router = useRouter();
  const [archive] = useArchiveRuleMutation();

  return (
    <div className="flex items-center gap-2">
      <Modal
        size="lg"
        trigger={
          <Button color="secondary" iconLeading={IconPencil}>
            {t('edit')}
          </Button>
        }
        title={t('edit')}
      >
        {(close) => <Editing rule={rule} onDone={close} />}
      </Modal>
      <ConfirmDialog
        trigger={
          <Button color="secondary" iconLeading={IconArchive}>
            {t('archive')}
          </Button>
        }
        title={t('archiveTitle', { title: rule.title })}
        description={t('archiveHint')}
        confirmLabel={t('archive')}
        onConfirm={async () => {
          const result = await archive(rule.id);
          if (!('error' in result)) {
            router.push(`/frameworks/${encodeURIComponent(rule.frameworkId)}`);
          }
          return result;
        }}
      />
    </div>
  );
}

function Editing({ rule, onDone }: { rule: RuleResponse; onDone: () => void }) {
  const t = useTranslations('frameworks.ruleForm');
  const [save, { isLoading, error }] = useUpdateRuleMutation();

  return (
    <RuleForm
      initial={{ reference: rule.reference, title: rule.title, summary: rule.summary }}
      submitLabel={t('save')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await save({ id: rule.id, ...values });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
