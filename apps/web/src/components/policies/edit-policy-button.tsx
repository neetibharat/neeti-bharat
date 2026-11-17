'use client';

import { IconPencil } from '@tabler/icons-react';
import type { PolicyDetailResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Modal } from '@/components/base/modal/modal';
import { useCan } from '@/components/providers/user-provider';
import { useRouter } from '@/i18n/navigation';
import {
  useArchivePolicyMutation,
  useSavePolicyContentMutation,
  useSavePolicyDetailsMutation,
} from '@/lib/api/policy-edit-api';
import { ImportFromFile, type ImportedPolicy } from './import-from-file';
import { PolicyForm, type PolicyFormValues } from './policy-form';

/** Changes a policy's title, summary, owner and approver title, can fill them in from a file, and can archive it. */
export function EditPolicyButton({ policy }: { policy: PolicyDetailResponse }) {
  const { canEdit } = useCan();
  const t = useTranslations('policies.edit');
  if (!canEdit) return null;

  return (
    <Modal
      size="xl"
      trigger={
        <Button color="secondary" iconLeading={IconPencil}>
          {t('button')}
        </Button>
      }
      title={t('title')}
      description={t('hint')}
    >
      {(close) => <EditForm policy={policy} onDone={close} />}
    </Modal>
  );
}

/** What the policy says now, with whatever the file said laid over it. What the file left out stays as it was. */
function editingValues(
  policy: PolicyDetailResponse,
  imported: ImportedPolicy | null,
): PolicyFormValues {
  const read = imported?.policy;
  if (!read) {
    const { title, summary, ownerRole, approver: approverTitle } = policy;
    return { title, summary, ownerRole, approverTitle };
  }
  return {
    title: read.title,
    summary: read.summary,
    ownerRole: read.ownerRole ?? policy.ownerRole,
    approverTitle: read.approverTitle || policy.approver,
  };
}

/** Whether the text of the file takes the place of the text in the editor. Only a draft can have its text replaced. */
function ReplaceText(props: {
  isDraft: boolean;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useTranslations('policies.import');
  if (!props.isDraft) return <Alert>{t('replaceBlocked')}</Alert>;

  return (
    <div className="flex flex-col gap-1">
      <Checkbox isSelected={props.value} onChange={props.onChange}>
        {t('replaceText')}
      </Checkbox>
      <p className="pl-7 text-caption text-fg-muted">{t('replaceTextHint')}</p>
    </div>
  );
}

/** Saves the details, then the text when it is to be replaced. The text is only touched once the details are saved. */
function useSavePolicy(policy: PolicyDetailResponse, onDone: () => void) {
  const [saveDetails, details] = useSavePolicyDetailsMutation();
  const [saveContent, content] = useSavePolicyContentMutation();

  async function save(values: PolicyFormValues, newText: ImportedPolicy | null) {
    const saved = await saveDetails({ policyId: policy.id, ...values });
    if ('error' in saved) return;
    if (newText) {
      const replaced = await saveContent({ policyId: policy.id, content: newText.policy.content });
      if ('error' in replaced) return;
    }
    onDone();
  }

  return {
    save,
    isSaving: details.isLoading || content.isLoading,
    error: details.error ?? content.error,
  };
}

/** The file on the left, which fills in the form on the right. They stack on a narrow screen. */
function EditForm({ policy, onDone }: { policy: PolicyDetailResponse; onDone: () => void }) {
  const t = useTranslations('policies.form');
  const { save, isSaving, error } = useSavePolicy(policy, onDone);
  const [imported, setImported] = useState<ImportedPolicy | null>(null);
  const [replace, setReplace] = useState(true);
  const isDraft = policy.status === 'draft';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <ImportFromFile mode="edit" imported={imported} onRead={setImported}>
        <ReplaceText isDraft={isDraft} value={replace} onChange={setReplace} />
      </ImportFromFile>
      <PolicyForm
        key={imported?.version ?? 0}
        initial={editingValues(policy, imported)}
        submitLabel={t('save')}
        isSaving={isSaving}
        error={error}
        onCancel={onDone}
        onSubmit={(values) => save(values, isDraft && replace ? imported : null)}
        extra={<ArchiveButton policyId={policy.id} />}
      />
    </div>
  );
}

function ArchiveButton({ policyId }: { policyId: string }) {
  const t = useTranslations('policies.form');
  const router = useRouter();
  const [archive, { isLoading }] = useArchivePolicyMutation();

  return (
    <Button
      color="tertiary"
      isLoading={isLoading}
      onPress={async () => {
        const result = await archive(policyId);
        if (!('error' in result)) router.push('/policies');
      }}
    >
      {t('archive')}
    </Button>
  );
}
