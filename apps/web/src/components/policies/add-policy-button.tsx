'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useOpenFromLink } from '@/lib/hooks/use-open-from-link';
import { useCan } from '@/components/providers/user-provider';
import { useGetFrameworksQuery } from '@/lib/api/frameworks-api';
import { useCreatePolicyMutation } from '@/lib/api/policy-edit-api';
import { useRouter } from '@/i18n/navigation';
import { ImportFromFile, type ImportedPolicy } from './import-from-file';
import { PolicyForm, type PolicyFormValues } from './policy-form';

/** Adds a policy of the company's own, as a draft, and opens it so the text can be written. */
export function AddPolicyButton() {
  const { canEdit } = useCan();
  const t = useTranslations('policies.add');
  const openFromLink = useOpenFromLink();
  if (!canEdit) return null;

  return (
    <Modal
      defaultOpen={openFromLink}
      size="xl"
      trigger={
        <Button color="secondary" iconLeading={IconPlus}>
          {t('button')}
        </Button>
      }
      title={t('title')}
      description={t('hint')}
    >
      {(close) => <AddForm onDone={close} />}
    </Modal>
  );
}

/** The form starts empty, or from a file when one was read. A file that did not name an owner leaves the default. */
function startingValues(imported: ImportedPolicy | null, frameworkId: string): PolicyFormValues {
  const { title = '', summary = '', ownerRole = null, approverTitle = '' } = imported?.policy ?? {};
  return { title, summary, ownerRole: ownerRole ?? 'DPO', approverTitle, frameworkId };
}

/** The file to start from on the left, which fills in the form on the right. They stack on a narrow screen. */
function AddForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('policies.form');
  const router = useRouter();
  const { data } = useGetFrameworksQuery();
  const [create, { isLoading, error }] = useCreatePolicyMutation();
  const [imported, setImported] = useState<ImportedPolicy | null>(null);
  if (!data) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <ImportFromFile mode="add" imported={imported} onRead={setImported} />
      <PolicyForm
        key={imported?.version ?? 0}
        initial={startingValues(imported, data.frameworks[0]?.id ?? '')}
        submitLabel={t('create')}
        isSaving={isLoading}
        error={error}
        onCancel={onDone}
        onSubmit={async (values) => {
          const content = imported?.policy.content;
          const result = await create({
            ...values,
            frameworkId: values.frameworkId!,
            ...(content && { content }),
          });
          if ('error' in result) return;
          onDone();
          router.push(`/policies/${result.data.id}`);
        }}
      />
    </div>
  );
}
