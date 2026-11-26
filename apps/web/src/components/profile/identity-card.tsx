'use client';

import { isValidProfileValue, type ProfileEntryResponse } from '@neeti-bharat/shared';
import { LOGO_EXTENSIONS, LOGO_MAX_BYTES } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/base/button/button';
import { Input } from '@/components/base/input/input';
import { formatFileSize } from '@/lib/file-size';
import { isIdentityKey } from '@/lib/guards';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { listAllowedTypes } from '@/lib/proof-file';
import { LogoTile } from './logo-tile';
import { useEntryText } from './use-entry-text';
import { useSaveEntry } from './use-save-entry';

/** One answer being edited: its draft, whether it can be saved, and how. */
function useIdentityField(entry: ProfileEntryResponse) {
  const text = useEntryText();
  const t = useTranslations('profile');
  const errorMessage = useErrorMessage();
  const { save, isSaving, error } = useSaveEntry(entry.key);
  const [draft, setDraft] = useState(entry.value);
  const invalid = !isValidProfileValue(entry.kind, draft);

  return {
    entry,
    draft,
    setDraft,
    changed: draft !== entry.value,
    invalid,
    isSaving,
    save: () => save(draft),
    label: text.label(entry),
    hint: isIdentityKey(entry.key) ? t(`general.fields.${entry.key}.hint`) : undefined,
    problem: invalid ? errorMessage({ code: 'VALIDATION_FAILED' }) : error && errorMessage(error),
  };
}

type Field = ReturnType<typeof useIdentityField>;

function FieldInput({ field }: { field: Field }) {
  return (
    <Input
      label={field.label}
      hint={field.hint}
      value={field.draft}
      onChange={field.setDraft}
      error={field.problem || undefined}
    />
  );
}

function IdentityFooter({ fields, onSave }: { fields: Field[]; onSave: () => void }) {
  const t = useTranslations('profile');
  const canSave = fields.some((field) => field.changed) && !fields.some((field) => field.invalid);

  return (
    <footer className="flex min-h-14 items-center justify-between gap-4 rounded-b-card border-t border-line bg-surface-muted/60 px-6 py-3">
      <p className="text-label text-fg-subtle">
        {t('logo.hint', {
          types: listAllowedTypes([...LOGO_EXTENSIONS]),
          max: formatFileSize(LOGO_MAX_BYTES),
        })}
      </p>
      <Button
        isDisabled={!canSave}
        isLoading={fields.some((field) => field.isSaving)}
        onPress={onSave}
      >
        {t('general.save')}
      </Button>
    </footer>
  );
}

/**
 * The organisation's identity in one card: the logo beside the name and website, and one Save for what was changed.
 * The same answers fill the policies, the notice and the auditor reports.
 */
export function IdentityCard({
  name,
  website,
}: {
  name: ProfileEntryResponse;
  website?: ProfileEntryResponse;
}) {
  const t = useTranslations('profile.general.identity');
  const nameField = useIdentityField(name);
  const websiteField = useIdentityField(website ?? name);
  const fields = website ? [nameField, websiteField] : [nameField];

  async function saveAll() {
    for (const field of fields.filter((each) => each.changed)) if (!(await field.save())) return;
  }

  return (
    <section className="rounded-card border border-line/70 bg-surface shadow-card">
      <div className="p-6">
        <h2 className="text-subtitle font-semibold text-fg">{t('title')}</h2>
        <p className="mt-0.5 text-body text-fg-muted">{t('description')}</p>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          <LogoTile name={nameField.draft || name.value} />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {fields.map((field) => (
              <FieldInput key={field.entry.key} field={field} />
            ))}
          </div>
        </div>
      </div>
      <IdentityFooter fields={fields} onSave={() => void saveAll()} />
    </section>
  );
}
