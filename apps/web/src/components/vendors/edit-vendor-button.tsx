'use client';

import { IconPencil } from '@tabler/icons-react';
import type { VendorResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useUpdateVendorMutation } from '@/lib/api/vendors-api';
import { toUpdateRequest, toValues, type VendorSection } from '@/lib/vendors';
import { VendorForm } from './vendor-form';

/** Changes one part of a vendor in a short form of its own. */
export function EditVendorButton({
  vendor,
  section,
}: {
  vendor: VendorResponse;
  section: VendorSection;
}) {
  const t = useTranslations('vendors.sections');
  return (
    <Modal
      trigger={
        <Button color="secondary" size="sm" iconLeading={IconPencil}>
          {t('edit')}
        </Button>
      }
      title={t(`${section}.editTitle`)}
    >
      {(close) => <EditForm vendor={vendor} section={section} onDone={close} />}
    </Modal>
  );
}

function EditForm(props: { vendor: VendorResponse; section: VendorSection; onDone: () => void }) {
  const t = useTranslations('vendors.form');
  const [update, { isLoading, error }] = useUpdateVendorMutation();
  const { vendor, section, onDone } = props;

  return (
    <VendorForm
      section={section}
      initial={toValues(vendor)}
      isSaving={isLoading}
      error={error}
      submitLabel={t('save')}
      onCancel={onDone}
      onSubmit={async (values) => {
        const result = await update({ id: vendor.id, ...toUpdateRequest(section, values) });
        if (!('error' in result)) onDone();
      }}
    />
  );
}
