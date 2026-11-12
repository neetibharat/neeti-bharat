'use client';

import { ORGANIZATION_NAME_MAX_LENGTH } from '@dpdp-kit/shared';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Input } from '@/components/base/input/input';
import { Link } from '@/i18n/navigation';
import { rememberOrganization } from '@/lib/active-organization';
import { useCreateOrganizationMutation } from '@/lib/api/organizations-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { openApp } from '@/lib/open-app';

/** Makes the organisation and moves into it. */
function useCreateOrganization() {
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const [create, { isLoading, error }] = useCreateOrganizationMutation();

  async function submit(name: string) {
    const result = await create({ name });
    if (!result.data) return;
    rememberOrganization(result.data.id);
    openApp(locale);
  }

  return { submit, isLoading, problem: error ? errorMessage(error) : null };
}

/** Asks for the organisation's name, makes it, and moves into it. Anyone who already has one can go back. */
export function CreateOrganizationForm({ canCancel }: { canCancel: boolean }) {
  const t = useTranslations('organization.create');
  const [name, setName] = useState('');
  const { submit, isLoading, problem } = useCreateOrganization();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(name);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label={t('label')}
        placeholder={t('placeholder')}
        value={name}
        onChange={setName}
        maxLength={ORGANIZATION_NAME_MAX_LENGTH}
        isRequired
        autoFocus
      />
      {problem && <Alert tone="error">{problem}</Alert>}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          isLoading={isLoading}
          isDisabled={!name.trim()}
        >
          {t('submit')}
        </Button>
        {canCancel && (
          <Link href="/" className="text-label font-medium text-fg-muted hover:text-fg">
            {t('cancel')}
          </Link>
        )}
      </div>
    </form>
  );
}
