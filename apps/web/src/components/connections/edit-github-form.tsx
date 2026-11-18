'use client';

import {
  CONNECTION_NAME_MAX_LENGTH,
  GITHUB_KEY_MAX_LENGTH,
  type ConnectionSummary,
  type GithubSelection,
  type UpdateConnectionRequest,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Textarea } from '@/components/base/textarea/textarea';
import {
  useGetGithubRepositoriesQuery,
  useUpdateConnectionMutation,
} from '@/lib/api/connections-api';
import { selectionIsUsable, selectionOf, selectionToSend } from '@/lib/github-selection';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { RepositoryChoice } from './repository-choice';

interface Values {
  name: string;
  /** Empty means keep the key there is. */
  privateKey: string;
  selection: GithubSelection;
}

const sameSelection = (a: GithubSelection, b: GithubSelection): boolean =>
  a.mode === b.mode &&
  [...a.repositories].sort().join(',') === [...b.repositories].sort().join(',');

/** The request that changes only what differs from `initial`, or null when nothing does. */
function changesOf(initial: Values, values: Values): UpdateConnectionRequest | null {
  const name = values.name.trim();
  const key = values.privateKey.trim();
  const selectionChanged = !sameSelection(
    selectionToSend(initial.selection),
    selectionToSend(values.selection),
  );
  if (name === initial.name && key === '' && !selectionChanged) return null;
  return {
    name,
    ...(key !== '' && { credentials: { privateKey: key } }),
    ...(selectionChanged && { repositories: selectionToSend(values.selection) }),
  };
}

/** The repositories the App can see, then the choice, which is shown only once they are read. */
function Repositories({
  id,
  value,
  onChange,
}: {
  id: string;
  value: GithubSelection;
  onChange: (selection: GithubSelection) => void;
}) {
  const t = useTranslations('connections.repositories');
  const errorMessage = useErrorMessage();
  const { data, error } = useGetGithubRepositoriesQuery(id);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <p className="text-label text-fg-muted">{t('loading')}</p>;
  return <RepositoryChoice repositories={data.items} value={value} onChange={onChange} />;
}

/** The name, and the organisation it is fixed to. */
function Identity({
  connection,
  name,
  onName,
}: {
  connection: ConnectionSummary;
  name: string;
  onName: (name: string) => void;
}) {
  const t = useTranslations('connections.edit');
  const form = useTranslations('connections.form');
  const github = useTranslations('connections.githubForm');

  return (
    <>
      <Input
        label={form('name')}
        value={name}
        onChange={onName}
        maxLength={CONNECTION_NAME_MAX_LENGTH}
        isRequired
      />
      <Input
        label={github('organisation')}
        hint={t('installationHint')}
        value={connection.identifiers.account ?? ''}
        isDisabled
      />
    </>
  );
}

/** The key to replace the one there is. Empty keeps it. */
function KeyField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations('connections.edit');
  const github = useTranslations('connections.githubForm');

  return (
    <Textarea
      label={github('fields.privateKey')}
      hint={t('privateKeyHint')}
      value={value}
      onChange={onChange}
      maxLength={GITHUB_KEY_MAX_LENGTH}
      rows={3}
      autoComplete="off"
    />
  );
}

/** The values, what they would change, and the saving of it. */
function useEdit(connection: ConnectionSummary, onDone: () => void) {
  const [update, { isLoading, error }] = useUpdateConnectionMutation();
  const initial: Values = {
    name: connection.name,
    privateKey: '',
    selection: selectionOf(connection.identifiers),
  };
  const [values, setValues] = useState<Values>(initial);
  const changes = changesOf(initial, values);
  const usable = values.name.trim() !== '' && selectionIsUsable(values.selection);

  async function save() {
    if (!changes) return;
    const result = await update({ id: connection.id, ...changes });
    if (!('error' in result)) onDone();
  }

  return {
    values,
    change: (next: Partial<Values>) => setValues({ ...values, ...next }),
    changes,
    usable,
    save,
    isLoading,
    error,
  };
}

/** What went wrong, or that GitHub is being asked about a new key. */
function Status({ error, waiting }: { error: unknown; waiting: boolean }) {
  const github = useTranslations('connections.githubForm');
  const errorMessage = useErrorMessage();

  return (
    <>
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      {waiting && <p className="text-label text-fg-muted">{github('wait')}</p>}
    </>
  );
}

/** The name, the repositories it reads and, when it was replaced, a new private key. */
export function EditGithubForm({
  connection,
  onDone,
}: {
  connection: ConnectionSummary;
  onDone: () => void;
}) {
  const t = useTranslations('connections.edit');
  const form = useTranslations('connections.form');
  const edit = useEdit(connection, onDone);
  const { values, change } = edit;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void edit.save();
      }}
      className="flex flex-col gap-4"
    >
      <Identity connection={connection} name={values.name} onName={(name) => change({ name })} />
      <Repositories
        id={connection.id}
        value={values.selection}
        onChange={(selection) => change({ selection })}
      />
      <KeyField value={values.privateKey} onChange={(privateKey) => change({ privateKey })} />
      <Status error={edit.error} waiting={edit.isLoading && Boolean(edit.changes?.credentials)} />
      <FormActions
        cancelLabel={form('cancel')}
        submitLabel={t('save')}
        onCancel={onDone}
        isDisabled={!edit.changes || !edit.usable}
        isLoading={edit.isLoading}
      />
    </form>
  );
}
