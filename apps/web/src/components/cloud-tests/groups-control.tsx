'use client';

import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { CHECK_GROUPS, type ConnectionSummary } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Modal } from '@/components/base/modal/modal';
import { useSetConnectionGroupsMutation } from '@/lib/api/connections-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

type Words = (key: string, values?: Record<string, string | number>) => string;

/** The groups being ticked, and saving the ones left unticked as off. */
function useGroupsForm(connection: ConnectionSummary, onDone: () => void) {
  const [save, { isLoading, error }] = useSetConnectionGroupsMutation();
  const [off, setOff] = useState<string[]>(connection.groupsOff);
  const toggle = (id: string, on: boolean) =>
    setOff((current) => (on ? current.filter((group) => group !== id) : [...current, id]));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await save({ id: connection.id, groupsOff: off });
    if (!('error' in result)) onDone();
  }

  return { off, toggle, submit, isLoading, error };
}

/** A group's name, how many checks it holds, and what it covers. */
function GroupLabel({ id, count }: { id: string; count: number }) {
  const t = useTranslations('cloudTests.groupsChoice');
  const groupWords = useTranslations('connections.groups') as unknown as Words;

  return (
    <span className="flex min-w-0 flex-col">
      <span className="font-medium">
        {groupWords(`${id}.title`)}{' '}
        <span className="font-normal text-fg-muted">{t('checks', { count })}</span>
      </span>
      <span className="text-label text-fg-muted">{groupWords(`${id}.about`)}</span>
    </span>
  );
}

function GroupsForm({ connection, onDone }: { connection: ConnectionSummary; onDone: () => void }) {
  const t = useTranslations('cloudTests.groupsChoice');
  const errorMessage = useErrorMessage();
  const { off, toggle, submit, isLoading, error } = useGroupsForm(connection, onDone);
  const groups = CHECK_GROUPS[connection.provider];
  const allOff = off.length === groups.length;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {groups.map((group) => (
          <li key={group.id}>
            <Checkbox
              isSelected={!off.includes(group.id)}
              onChange={(on) => toggle(group.id, on)}
              className="items-start"
            >
              <GroupLabel id={group.id} count={group.checks.length} />
            </Checkbox>
          </li>
        ))}
      </ul>
      {allOff && <Alert tone="info">{t('atLeastOne')}</Alert>}
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={t('save')}
        onCancel={onDone}
        isDisabled={allOff}
        isLoading={isLoading}
      />
    </form>
  );
}

/**
 * Which groups of checks the account runs, beside its schedule. An admin can turn off what it does not use; everyone
 * else is told what is left out.
 */
export function GroupsControl({
  connection,
  canChange,
}: {
  connection: ConnectionSummary;
  canChange: boolean;
}) {
  const t = useTranslations('cloudTests.groupsChoice');
  const groupWords = useTranslations('connections.groups') as unknown as Words;
  const total = CHECK_GROUPS[connection.provider].length;
  const on = total - connection.groupsOff.length;
  const summary = on === total ? t('all', { total }) : t('some', { on, total });

  if (!canChange) {
    if (connection.groupsOff.length === 0) return null;
    const names = connection.groupsOff.map((id) => groupWords(`${id}.title`)).join(', ');
    return <p className="text-label text-fg-muted">{t('readOnly', { groups: names })}</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label font-semibold text-fg">{t('label')}</span>
      <Modal
        trigger={
          <Button color="secondary" iconLeading={IconAdjustmentsHorizontal}>
            {summary}
          </Button>
        }
        title={t('title')}
        description={t('description')}
        size="lg"
      >
        {(close) => <GroupsForm connection={connection} onDone={close} />}
      </Modal>
    </div>
  );
}
