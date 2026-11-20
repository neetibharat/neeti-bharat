'use client';

import { IconUserPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useOpenFromLink } from '@/lib/hooks/use-open-from-link';
import { useAddPersonMutation } from '@/lib/api/people-api';
import { PersonForm } from './person-form';

const EMPTY = { name: '', email: '', department: '', jobTitle: '', access: 'member' } as const;

export function AddPersonButton() {
  const t = useTranslations('people');
  const openFromLink = useOpenFromLink();
  return (
    <Modal
      defaultOpen={openFromLink}
      trigger={<Button iconLeading={IconUserPlus}>{t('addPerson')}</Button>}
      title={t('addPerson')}
    >
      {(close) => <AddPersonForm onDone={close} />}
    </Modal>
  );
}

function AddPersonForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('people.form');
  const [add, { isLoading, error }] = useAddPersonMutation();

  return (
    <PersonForm
      initial={EMPTY}
      isSaving={isLoading}
      error={error}
      submitLabel={t('add')}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await add({
          name: values.name,
          email: values.email,
          department: values.department || undefined,
          jobTitle: values.jobTitle || undefined,
          access: values.access,
        });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
