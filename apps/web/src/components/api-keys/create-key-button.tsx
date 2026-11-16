'use client';

import type { CreatedApiKeyResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState, type ReactElement } from 'react';
import { Modal } from '@/components/base/modal/modal';
import { CreateKeyForm } from './create-key-form';
import { NewKeyShown } from './new-key-shown';

/** Opens the form. Once the key is made the same dialog shows it, and closing the dialog forgets it. */
export function CreateKeyButton({ trigger }: { trigger: ReactElement }) {
  const t = useTranslations('apiKeys');
  const [created, setCreated] = useState<CreatedApiKeyResponse | null>(null);

  return (
    <Modal
      trigger={trigger}
      title={created ? t('created.title') : t('form.title')}
      description={created ? undefined : t('form.description')}
    >
      {(close) =>
        created ? (
          <NewKeyShown
            created={created}
            onDone={() => {
              setCreated(null);
              close();
            }}
          />
        ) : (
          <CreateKeyForm onCreated={setCreated} onCancel={close} />
        )
      }
    </Modal>
  );
}
