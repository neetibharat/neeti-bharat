'use client';

import { IconArchive, IconPencil } from '@tabler/icons-react';
import type { FrameworkResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { Modal } from '@/components/base/modal/modal';
import { useRouter } from '@/i18n/navigation';
import {
  useArchiveFrameworkMutation,
  useUpdateFrameworkMutation,
} from '@/lib/api/framework-edit-api';
import { FrameworkForm } from './framework-form';

/** Change or archive a framework the company made. Built-in frameworks have neither. */
export function FrameworkActions({ framework }: { framework: FrameworkResponse }) {
  const t = useTranslations('frameworks.actions');
  const router = useRouter();
  const [archive] = useArchiveFrameworkMutation();

  return (
    <div className="flex items-center gap-2">
      <Modal
        trigger={
          <Button color="secondary" iconLeading={IconPencil}>
            {t('edit')}
          </Button>
        }
        title={t('edit')}
      >
        {(close) => <Editing framework={framework} onDone={close} />}
      </Modal>
      <ConfirmDialog
        trigger={
          <Button color="secondary" iconLeading={IconArchive}>
            {t('archive')}
          </Button>
        }
        title={t('archiveTitle', { name: framework.name })}
        description={t('archiveHint')}
        confirmLabel={t('archive')}
        onConfirm={async () => {
          const result = await archive(framework.id);
          if (!('error' in result)) router.push('/frameworks');
          return result;
        }}
      />
    </div>
  );
}

function Editing({ framework, onDone }: { framework: FrameworkResponse; onDone: () => void }) {
  const t = useTranslations('frameworks.form');
  const [save, { isLoading, error }] = useUpdateFrameworkMutation();

  return (
    <FrameworkForm
      initial={{ name: framework.name, about: framework.about, seal: framework.seal }}
      submitLabel={t('save')}
      isSaving={isLoading}
      error={error}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await save({ id: framework.id, ...values });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
