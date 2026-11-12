'use client';

import { IconCheck, IconCopy } from '@tabler/icons-react';
import type { CreatedApiKeyResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';

/** The whole key, once. It cannot be read again, so the person is told to copy it before closing. */
export function NewKeyShown({
  created,
  onDone,
}: {
  created: CreatedApiKeyResponse;
  onDone: () => void;
}) {
  const t = useTranslations('apiKeys.created');
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
    } catch {
      // Copying is refused in some browsers. The key stays on screen to be selected by hand.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="info">{t('warning')}</Alert>
      <code className="block rounded-field bg-surface-muted px-3 py-2 font-mono text-label break-all text-fg select-all">
        {created.key}
      </code>
      <div className="flex justify-end gap-2">
        <Button
          color="secondary"
          iconLeading={copied ? IconCheck : IconCopy}
          onPress={() => void copy()}
        >
          {t(copied ? 'copied' : 'copy')}
        </Button>
        <Button onPress={onDone}>{t('done')}</Button>
      </div>
    </div>
  );
}
