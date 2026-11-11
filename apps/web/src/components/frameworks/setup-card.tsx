'use client';

import type { ProfileEntryResponse, ProfileKey } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/base/alert/alert';
import { Card } from '@/components/base/card/card';
import { Switch } from '@/components/base/switch/switch';
import { useGetProfileQuery, useUpdateProfileEntryMutation } from '@/lib/api/profile-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** The three set-up answers as switches. They decide which rules apply, and live in Company profile too. */
export function SetupCard() {
  const t = useTranslations('frameworks.setup');
  const tFields = useTranslations('profile.fields');
  const errorMessage = useErrorMessage();
  const { data } = useGetProfileQuery();
  const [update, { error }] = useUpdateProfileEntryMutation();
  const answers = data?.entries.filter((entry) => entry.group === 'setup') ?? [];
  if (!answers.length) return null;

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="divide-y divide-line">
        {answers.map((entry) => (
          <SetupRow
            key={entry.key}
            entry={entry}
            label={tFields(`${entry.key as ProfileKey}.label`)}
            hint={tFields(`${entry.key as ProfileKey}.hint`)}
            onChange={(isOn) => void update({ key: entry.key, value: isOn ? 'yes' : 'no' })}
          />
        ))}
      </div>
      {error && (
        <Alert tone="error" className="mt-3">
          {errorMessage(error)}
        </Alert>
      )}
    </Card>
  );
}

interface SetupRowProps {
  entry: ProfileEntryResponse;
  label: string;
  hint: string;
  onChange: (isOn: boolean) => void;
}

function SetupRow({ entry, label, hint, onChange }: SetupRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-label font-semibold text-fg">{label}</p>
        <p className="text-caption text-fg-subtle">{hint}</p>
      </div>
      <Switch aria-label={label} isSelected={entry.value === 'yes'} onChange={onChange} />
    </div>
  );
}
