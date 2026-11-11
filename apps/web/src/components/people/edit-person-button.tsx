'use client';

import { IconPencil } from '@tabler/icons-react';
import type { PersonResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useUpdatePersonMutation } from '@/lib/api/people-api';
import { PersonForm } from './person-form';

export function EditPersonButton({ person }: { person: PersonResponse }) {
  const t = useTranslations('people');
  return (
    <Modal
      trigger={
        <Button
          color="tertiary"
          size="sm"
          isIconOnly
          iconLeading={IconPencil}
          aria-label={t('edit')}
        />
      }
      title={t('editTitle')}
    >
      {(close) => <EditPersonForm person={person} onDone={close} />}
    </Modal>
  );
}

function EditPersonForm({ person, onDone }: { person: PersonResponse; onDone: () => void }) {
  const t = useTranslations('people.form');
  const [update, { isLoading, error }] = useUpdatePersonMutation();

  return (
    <PersonForm
      isEditing
      initial={{
        name: person.name,
        email: person.email,
        department: person.department ?? '',
        jobTitle: person.jobTitle ?? '',
        access: person.access === 'staff' ? 'member' : person.access,
      }}
      isSaving={isLoading}
      error={error}
      submitLabel={t('save')}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await update({
          id: person.id,
          name: values.name,
          department: values.department || null,
          jobTitle: values.jobTitle || null,
        });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
