'use client';

import { IconArchive, IconPencil } from '@tabler/icons-react';
import type { ProofRequirementResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { Modal } from '@/components/base/modal/modal';
import { RequirementForm } from '@/components/proof/requirement-form';
import { useRouter } from '@/i18n/navigation';
import { useArchiveRequirementMutation, useSaveRequirementMutation } from '@/lib/api/evidence-api';

/** Change or archive one requirement, from its own page. Archiving goes back to that control's list. */
export function RequirementActions(props: {
  requirement: ProofRequirementResponse;
  controlId: string;
}) {
  const t = useTranslations('frameworks.proof');
  const router = useRouter();
  const [archive] = useArchiveRequirementMutation();

  return (
    <div className="flex items-center gap-2">
      <Modal
        trigger={
          <Button color="secondary" iconLeading={IconPencil}>
            {t('edit')}
          </Button>
        }
        title={t('edit')}
        size="lg"
      >
        {(close) => <Editing requirement={props.requirement} onDone={close} />}
      </Modal>
      <ConfirmDialog
        trigger={
          <Button color="secondary" iconLeading={IconArchive}>
            {t('archive')}
          </Button>
        }
        title={t('archiveTitle', { title: props.requirement.title })}
        description={t('archiveBody')}
        confirmLabel={t('archive')}
        onConfirm={async () => {
          const result = await archive(props.requirement.id);
          if (!('error' in result)) {
            router.push(`/proof?control=${encodeURIComponent(props.controlId)}`);
          }
          return result;
        }}
      />
    </div>
  );
}

function Editing(props: { requirement: ProofRequirementResponse; onDone: () => void }) {
  const t = useTranslations('frameworks.proof.form');
  const { requirement } = props;
  const [save, { isLoading, error }] = useSaveRequirementMutation();

  return (
    <RequirementForm
      initial={{
        title: requirement.title,
        description: requirement.description,
        frequency: requirement.frequency,
        assigneeId: requirement.assigneeId,
        dueDate: requirement.dueDate,
      }}
      submitLabel={t('save')}
      isSaving={isLoading}
      error={error}
      onCancel={props.onDone}
      onSubmit={async (values) => {
        const result = await save({ id: requirement.id, ...values });
        if (!('error' in result)) props.onDone();
      }}
    />
  );
}
