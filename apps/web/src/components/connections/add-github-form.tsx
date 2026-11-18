'use client';

import {
  GITHUB_ID_PATTERN,
  GITHUB_KEY_MAX_LENGTH,
  type GithubInstallation,
  type GithubSelection,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { Textarea } from '@/components/base/textarea/textarea';
import { useCreateConnectionMutation, useDiscoverGithubMutation } from '@/lib/api/connections-api';
import { selectionIsUsable, selectionToSend } from '@/lib/github-selection';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { GuideButton } from './guide-button';
import { RepositoryChoice } from './repository-choice';
import { SetupGuide } from './setup-guide';

interface Values {
  name: string;
  appId: string;
  privateKey: string;
  installationId: string;
  selection: GithubSelection;
}

const EMPTY: Values = {
  name: '',
  appId: '',
  privateKey: '',
  installationId: '',
  selection: { mode: 'all', repositories: [] },
};

const hasApp = (values: Values): boolean =>
  GITHUB_ID_PATTERN.test(values.appId.trim()) && values.privateKey.includes('PRIVATE KEY');

const isComplete = (values: Values): boolean =>
  values.name.trim() !== '' &&
  hasApp(values) &&
  values.installationId !== '' &&
  selectionIsUsable(values.selection);

/** Asks GitHub where the App is installed. What it finds is lost when the App's details change. */
function useDiscovery() {
  const [discover, { data, isLoading, error, reset }] = useDiscoverGithubMutation();
  const find = (values: Values) =>
    discover({ appId: values.appId.trim(), privateKey: values.privateKey.trim() });
  return { items: data?.items, isLoading, error, reset, find };
}

type Found = ReturnType<typeof useDiscovery>;
type Change = (change: Partial<Values>) => void;

/** The installation chosen, with its repositories. One installation is chosen for you. */
function InstallationChoice({
  items,
  values,
  onChange,
}: {
  items: GithubInstallation[];
  values: Values;
  onChange: Change;
}) {
  const t = useTranslations('connections.githubForm');
  const chosen = items.find((item) => item.id === values.installationId);

  return (
    <>
      {items.length > 1 && (
        <Select
          label={t('organisation')}
          options={items.map((item) => ({ id: item.id, label: item.account }))}
          selectedKey={values.installationId || null}
          onSelectionChange={(installationId) =>
            onChange({ installationId, selection: EMPTY.selection })
          }
        />
      )}
      {chosen && (
        <RepositoryChoice
          repositories={chosen.repositories}
          value={values.selection}
          onChange={(selection) => onChange({ selection })}
        />
      )}
    </>
  );
}

/** What the lookup found: where the App is installed, or why there is nothing to choose from. */
function DiscoveryResult({
  found,
  values,
  onChange,
}: {
  found: Found;
  values: Values;
  onChange: Change;
}) {
  const t = useTranslations('connections.githubForm');
  const errorMessage = useErrorMessage();
  const { items, error } = found;

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!items) return <p className="text-label text-fg-muted">{t('hint')}</p>;
  if (items.length === 0) return <Alert tone="info">{t('none')}</Alert>;
  return <InstallationChoice items={items} values={values} onChange={onChange} />;
}

/** Finds where the App is installed. One installation is chosen for you. */
function Discovery({
  found,
  values,
  onChange,
}: {
  found: Found;
  values: Values;
  onChange: Change;
}) {
  const t = useTranslations('connections.githubForm');

  async function lookup() {
    const result = await found.find(values);
    const only = result.data?.items.length === 1 ? result.data.items[0] : undefined;
    if (only) onChange({ installationId: only.id });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="self-start"
        color="secondary"
        isDisabled={!hasApp(values)}
        isLoading={found.isLoading}
        onPress={() => void lookup()}
      >
        {t(found.items ? 'findAgain' : 'find')}
      </Button>
      <DiscoveryResult found={found} values={values} onChange={onChange} />
    </div>
  );
}

/** The values of the form. A change to the App's details makes what was found, and the choices made from it, stale. */
function useValues(found: Found) {
  const [values, setValues] = useState<Values>(EMPTY);

  function change(next: Partial<Values>) {
    const touchesApp = 'appId' in next || 'privateKey' in next;
    if (touchesApp) found.reset();
    setValues((current) => ({
      ...current,
      ...next,
      ...(touchesApp && { installationId: '', selection: EMPTY.selection }),
    }));
  }

  return { values, change };
}

function AppFields({ values, onChange }: { values: Values; onChange: Change }) {
  const t = useTranslations('connections.githubForm');
  const form = useTranslations('connections.form');

  return (
    <>
      <Input
        label={form('name')}
        placeholder={form('namePlaceholder')}
        value={values.name}
        onChange={(name) => onChange({ name })}
        isRequired
      />
      <Input
        label={t('fields.appId')}
        value={values.appId}
        onChange={(appId) => onChange({ appId })}
        maxLength={12}
        inputMode="numeric"
        autoComplete="off"
        isRequired
      />
      <Textarea
        label={t('fields.privateKey')}
        hint={t('privateKeyHint')}
        value={values.privateKey}
        onChange={(privateKey) => onChange({ privateKey })}
        maxLength={GITHUB_KEY_MAX_LENGTH}
        rows={4}
        autoComplete="off"
        isRequired
      />
    </>
  );
}

/** Sends the details, trimmed. The form closes once GitHub has accepted them. */
function useAddConnection(onDone: () => void) {
  const [create, { isLoading, error }] = useCreateConnectionMutation();

  async function add(values: Values) {
    const result = await create({
      provider: 'github',
      name: values.name.trim(),
      credentials: {
        appId: values.appId.trim(),
        installationId: values.installationId,
        privateKey: values.privateKey.trim(),
      },
      repositories: selectionToSend(values.selection),
    });
    if (!('error' in result)) onDone();
  }

  return { add, isLoading, error };
}

/** What went wrong or is going on, and the buttons. */
function Footer({
  values,
  onDone,
  state,
}: {
  values: Values;
  onDone: () => void;
  state: { isLoading: boolean; error: unknown };
}) {
  const t = useTranslations('connections.githubForm');
  const form = useTranslations('connections.form');
  const errorMessage = useErrorMessage();

  return (
    <>
      {state.error ? <Alert tone="error">{errorMessage(state.error)}</Alert> : null}
      {state.isLoading && <p className="text-label text-fg-muted">{t('wait')}</p>}
      <FormActions
        cancelLabel={form('cancel')}
        submitLabel={t('submit')}
        onCancel={onDone}
        isDisabled={!isComplete(values)}
        isLoading={state.isLoading}
      />
    </>
  );
}

/** The App's ID and private key, then the organisation and repositories chosen from what the App can see. */
export function AddGithubForm({
  onDone,
  guideOpen,
  onGuideChange,
}: {
  onDone: () => void;
  /** Whether the setup guide replaces the form. The dialog around it owns this, to make itself wider for the guide. */
  guideOpen: boolean;
  onGuideChange: (open: boolean) => void;
}) {
  const t = useTranslations('connections.githubForm');
  const { add, isLoading, error } = useAddConnection(onDone);
  const found = useDiscovery();
  const { values, change } = useValues(found);

  // A dialog closed with the guide open must open on the form next time.
  useEffect(() => () => onGuideChange(false), [onGuideChange]);

  if (guideOpen) return <SetupGuide guide="github" onBack={() => onGuideChange(false)} />;

  return (
    <form
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void add(values);
      }}
      className="flex flex-col gap-4"
    >
      <GuideButton label={t('help')} onPress={() => onGuideChange(true)} />
      <AppFields values={values} onChange={change} />
      <Discovery found={found} values={values} onChange={change} />
      <Footer values={values} onDone={onDone} state={{ isLoading, error }} />
    </form>
  );
}
