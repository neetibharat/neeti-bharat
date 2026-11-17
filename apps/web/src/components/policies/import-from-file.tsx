'use client';

import { POLICY_IMPORT_MAX_BYTES, type PolicyImportResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { DropZone } from '@/components/base/drop-zone/drop-zone';
import { useCan } from '@/components/providers/user-provider';
import { Link } from '@/i18n/navigation';
import { useGetAiSettingsQuery, useImportPolicyMutation } from '@/lib/api/ai-api';
import { formatFileSize } from '@/lib/file-size';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { checkImportFile, IMPORT_PICKER_TYPES } from '@/lib/policy-import-file';

/** A policy read from a file. `version` changes with each file, so the form beside it starts over from it. */
export interface ImportedPolicy {
  fileName: string;
  policy: PolicyImportResponse;
  version: number;
}

/** Adding a policy takes everything from the file. Editing one fills the details and may replace the text. */
export type ImportMode = 'add' | 'edit';

/** What the person should look at again, because the AI had to guess or the file did not say. */
function ImportNotes({ imported, mode }: { imported: ImportedPolicy; mode: ImportMode }) {
  const t = useTranslations('policies.import');
  const { policy } = imported;
  const notes = [
    mode === 'add' && t('textReady'),
    !policy.titleFromFile && t('suggestedTitle'),
    !policy.summaryFromFile && t('suggestedSummary'),
    policy.ownerRole === null && t('ownerUnknown'),
    !policy.approverTitle && t('approverUnknown'),
  ].filter(Boolean);

  return (
    <Alert
      tone="success"
      title={t(mode === 'add' ? 'done' : 'doneEdit', { file: imported.fileName })}
    >
      <ul className="list-disc pl-4">
        {notes.map((note) => (
          <li key={String(note)}>{note}</li>
        ))}
      </ul>
    </Alert>
  );
}

/** Says why a file cannot be read yet: nothing is set up, and who can do something about it. */
function NotSetUp() {
  const t = useTranslations('policies.import');
  const { isAdmin } = useCan();

  return (
    <Alert>
      {isAdmin ? (
        <>
          {t('notSetUp')}{' '}
          <Link href="/settings/ai" className="font-medium underline">
            {t('setUp')}
          </Link>
        </>
      ) : (
        t('askAdmin')
      )}
    </Alert>
  );
}

/** Checks a file, has it read, and hands back what was read. A failure is kept for the person to see. */
function useReadFile(imported: ImportedPolicy | null, onRead: (imported: ImportedPolicy) => void) {
  const t = useTranslations('policies.import');
  const errorMessage = useErrorMessage();
  const [read, { isLoading }] = useImportPolicyMutation();
  const [problem, setProblem] = useState<string | null>(null);

  async function send([file]: File[]) {
    setProblem(null);
    if (!file) return;
    const issue = checkImportFile(file);
    if (issue) {
      return setProblem(t(`problems.${issue}`, { max: formatFileSize(POLICY_IMPORT_MAX_BYTES) }));
    }
    const result = await read(file);
    if ('error' in result) return setProblem(errorMessage(result.error));
    onRead({ fileName: file.name, policy: result.data, version: (imported?.version ?? 0) + 1 });
  }

  return { send, isLoading, problem };
}

export interface ImportFromFileProps {
  imported: ImportedPolicy | null;
  onRead: (imported: ImportedPolicy) => void;
  mode: ImportMode;
  /** Options that go with a file once one is read, such as whether it replaces the text. */
  children?: ReactNode;
}

function Panel({ mode, children }: { mode: ImportMode; children: ReactNode }) {
  const t = useTranslations('policies.import');

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-subtitle font-semibold text-fg">
        {t(mode === 'add' ? 'panelTitle' : 'panelTitleEdit')}
      </h3>
      {children}
    </section>
  );
}

/**
 * The side of the Add and Edit policy dialogs where a PDF, Word or PowerPoint file is read by the company's AI
 * service to fill in the form. Optional.
 */
export function ImportFromFile(props: ImportFromFileProps) {
  const t = useTranslations('policies.import');
  const { data: settings } = useGetAiSettingsQuery();
  const { send, isLoading, problem } = useReadFile(props.imported, props.onRead);
  if (!settings) return null;
  if (!settings.provider) {
    return (
      <Panel mode={props.mode}>
        <NotSetUp />
      </Panel>
    );
  }

  return (
    <Panel mode={props.mode}>
      <DropZone
        label={props.imported ? t('another') : t('drop')}
        hint={t('hint')}
        buttonLabel={t('choose')}
        loadingLabel={t('reading')}
        isLoading={isLoading}
        accept={IMPORT_PICKER_TYPES}
        onFiles={send}
      />
      {problem ? <Alert tone="error">{problem}</Alert> : null}
      {props.imported && !problem ? (
        <>
          <ImportNotes imported={props.imported} mode={props.mode} />
          {props.children}
        </>
      ) : null}
    </Panel>
  );
}
