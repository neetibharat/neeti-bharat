'use client';

import { IconWorldSearch } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { Input } from '@/components/base/input/input';
import { useGetProfileQuery } from '@/lib/api/profile-api';
import { useRunWebsiteCheckMutation } from '@/lib/api/website-check-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** The address to check, filled in from the company profile, and the button that runs the check. */
export function CheckForm({ onDone }: { onDone: (id: string) => void }) {
  const t = useTranslations('websiteCheck.form');
  const errorMessage = useErrorMessage();
  const { data: profile } = useGetProfileQuery();
  const [typed, setTyped] = useState<string | null>(null);
  const [run, { isLoading, error }] = useRunWebsiteCheckMutation();
  const saved = profile?.entries.find((entry) => entry.key === 'website')?.value ?? '';
  const url = typed ?? saved;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await run({ url });
    if (result.data) onDone(result.data.id);
  }

  return (
    <Card title={t('title')} description={t('description')}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            className="min-w-64 flex-1"
            label={t('label')}
            placeholder={t('placeholder')}
            value={url}
            onChange={setTyped}
            isRequired
          />
          <Button type="submit" iconLeading={IconWorldSearch} isLoading={isLoading}>
            {t(isLoading ? 'running' : 'submit')}
          </Button>
        </div>
        {isLoading && <p className="text-label text-fg-muted">{t('wait')}</p>}
        {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      </form>
    </Card>
  );
}
