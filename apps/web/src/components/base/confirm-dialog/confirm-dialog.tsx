'use client';

import { useTranslations } from 'next-intl';
import { useState, type ReactElement } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

export interface ConfirmDialogProps {
  /** The button that opens the dialog. */
  trigger: ReactElement;
  title: string;
  description?: string;
  confirmLabel: string;
  /** `danger` for things that remove or hide something. */
  tone?: 'danger' | 'primary';
  /**
   * Does the thing. Pass the mutation's result straight back: when it holds an `error`, the dialog stays open and
   * shows it; otherwise it closes.
   */
  onConfirm: () => Promise<unknown>;
}

const failed = (result: unknown): result is { error: unknown } =>
  typeof result === 'object' && result !== null && 'error' in result;

/** "Are you sure?" for something that cannot be taken back with one click. Shows the error if it fails. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal trigger={trigger} title={title} description={description}>
      {(close) => (
        <Actions confirmLabel={confirmLabel} tone={tone} onConfirm={onConfirm} onClose={close} />
      )}
    </Modal>
  );
}

function Actions(props: {
  confirmLabel: string;
  tone: 'danger' | 'primary';
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const t = useTranslations('confirm');
  const errorMessage = useErrorMessage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function confirm() {
    setBusy(true);
    const result = await props.onConfirm();
    setBusy(false);
    if (failed(result)) setError(result.error);
    else props.onClose();
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button color="secondary" onPress={props.onClose}>
          {t('cancel')}
        </Button>
        <Button color={props.tone} isLoading={busy} onPress={() => void confirm()}>
          {props.confirmLabel}
        </Button>
      </div>
    </div>
  );
}
