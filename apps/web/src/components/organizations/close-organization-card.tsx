'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Input } from '@/components/base/input/input';
import { Modal } from '@/components/base/modal/modal';
import { useCurrentUser } from '@/components/providers/user-provider';
import { useCloseOrganizationMutation } from '@/lib/api/organizations-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { openApp } from '@/lib/open-app';

/** Asks for the name to be typed out, closes the organisation, and reloads the app into whichever one is left. */
function CloseForm({ name, onCancel }: { name: string; onCancel: () => void }) {
  const t = useTranslations('organization.close');
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const [close, { isLoading, error }] = useCloseOrganizationMutation();
  const [typed, setTyped] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await close({ name: typed });
    if (!('error' in result)) openApp(locale);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-body text-fg-muted">{t('body')}</p>
      <Input label={t('label', { name })} value={typed} onChange={setTyped} autoFocus />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button color="secondary" onPress={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          color="danger"
          isLoading={isLoading}
          isDisabled={typed.trim() !== name}
        >
          {t('confirm')}
        </Button>
      </div>
    </form>
  );
}

/** The danger zone of General settings. Closing hides the organisation from everyone; nothing in it is erased. */
export function CloseOrganizationCard() {
  const t = useTranslations('organization.close');
  const user = useCurrentUser();
  if (!user) return null;
  const { name } = user.organization;

  return (
    <section aria-labelledby="close-organization" className="flex flex-col gap-3">
      <h2 className="text-label font-semibold tracking-wide text-danger uppercase">{t('zone')}</h2>
      <div className="flex flex-col justify-between gap-4 rounded-card border border-danger/30 bg-surface p-6 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h3 id="close-organization" className="text-subtitle font-semibold text-fg">
            {t('title')}
          </h3>
          <p className="mt-0.5 text-body text-fg-muted">{t('description')}</p>
        </div>
        <Modal
          trigger={
            <Button color="danger" className="shrink-0">
              {t('action')}
            </Button>
          }
          title={t('dialogTitle', { name })}
        >
          {(close) => <CloseForm name={name} onCancel={close} />}
        </Modal>
      </div>
    </section>
  );
}
