'use client';

import { isValidProfileValue, type ProfileEntryResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Input } from '@/components/base/input/input';
import { PageSkeleton } from '@/components/base/skeleton/skeleton';
import { PageHeader } from '@/components/base/page-header/page-header';
import { SettingCard } from '@/components/base/setting-card/setting-card';
import { useGetProfileQuery } from '@/lib/api/profile-api';
import { isIdentityKey } from '@/lib/guards';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useEntryText } from './use-entry-text';
import { LogoSetting } from './logo-setting';
import { useSaveEntry } from './use-save-entry';

/** The company's identity, one setting per card. The same answers are used in policies and notices. */
export function GeneralSettings() {
  const t = useTranslations('profile');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetProfileQuery();

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <PageSkeleton />;

  const identity = data.entries.filter((entry) => entry.group === 'general');

  return (
    <>
      <PageHeader title={t('general.title')} description={t('general.description')} />
      <div className="flex flex-col gap-5">
        <LogoSetting />
        {identity.map((entry) => (
          <IdentityField key={entry.key} entry={entry} />
        ))}
      </div>
    </>
  );
}

function IdentityField({ entry }: { entry: ProfileEntryResponse }) {
  const t = useTranslations('profile');
  const text = useEntryText();
  const errorMessage = useErrorMessage();
  const { save, isSaving, error } = useSaveEntry(entry.key);
  const [draft, setDraft] = useState(entry.value);
  const invalid = !isValidProfileValue(entry.kind, draft);
  const problem = invalid
    ? errorMessage({ code: 'VALIDATION_FAILED' })
    : error && errorMessage(error);

  return (
    <SettingCard
      title={text.label(entry)}
      description={text.hint(entry)}
      hint={isIdentityKey(entry.key) ? t(`general.fields.${entry.key}.hint`) : undefined}
      action={
        <Button
          isDisabled={invalid || draft === entry.value}
          isLoading={isSaving}
          onPress={() => void save(draft)}
        >
          {t('general.save')}
        </Button>
      }
    >
      <Input
        aria-label={text.label(entry)}
        value={draft}
        onChange={setDraft}
        error={problem || undefined}
      />
    </SettingCard>
  );
}
