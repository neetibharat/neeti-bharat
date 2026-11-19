'use client';

import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useRouter } from '@/i18n/navigation';
import { useAddVendorMutation } from '@/lib/api/vendors-api';
import { NEW_VENDOR, toAddRequest } from '@/lib/vendors';
import { VendorForm } from './vendor-form';

/** Adds a vendor with only who it is and what it does, then opens its page to fill in the rest. */
export function AddVendorButton() {
  const t = useTranslations('vendors');
  return (
    <Modal
      trigger={<Button iconLeading={IconPlus}>{t('add')}</Button>}
      title={t('add')}
      description={t('addHint')}
    >
      {(close) => <AddVendorForm onDone={close} />}
    </Modal>
  );
}

function AddVendorForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('vendors.form');
  const router = useRouter();
  const [add, { isLoading, error }] = useAddVendorMutation();

  return (
    <VendorForm
      section="details"
      initial={NEW_VENDOR}
      isSaving={isLoading}
      error={error}
      submitLabel={t('add')}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await add(toAddRequest(values));
        if ('error' in result) return;
        onDone();
        router.push(`/vendors/${result.data.id}`);
      }}
    />
  );
}
