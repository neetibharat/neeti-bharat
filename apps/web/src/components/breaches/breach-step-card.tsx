'use client';

import { BREACH_NOTE_MAX_LENGTH, type BreachResponse, type BreachStep } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { ConfirmDialog } from '@/components/base/confirm-dialog/confirm-dialog';
import { Textarea } from '@/components/base/textarea/textarea';
import { useCompleteBreachStepMutation } from '@/lib/api/breaches-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** The button that marks the step done. Closing asks first, since a closed breach cannot be changed. */
function DoneButton(props: {
  step: BreachStep;
  isLoading: boolean;
  onDone: () => Promise<unknown>;
}) {
  const t = useTranslations('breaches');
  const label = t('detail.markDone', { step: t(`steps.${props.step}`) });

  if (props.step === 'close') {
    return (
      <ConfirmDialog
        trigger={<Button>{label}</Button>}
        title={t('detail.closeTitle')}
        description={t('detail.closeText')}
        confirmLabel={label}
        tone="primary"
        onConfirm={props.onDone}
      />
    );
  }
  return (
    <Button isLoading={props.isLoading} onPress={() => void props.onDone()}>
      {label}
    </Button>
  );
}

function StepForm({ breachId, step }: { breachId: string; step: BreachStep }) {
  const t = useTranslations('breaches');
  const errorMessage = useErrorMessage();
  const [note, setNote] = useState('');
  const [complete, { isLoading, error }] = useCompleteBreachStepMutation();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-fg-muted">{t(`stepHints.${step}`)}</p>
      <Textarea
        label={t('detail.notes')}
        hint={t('detail.notesHint')}
        value={note}
        onChange={setNote}
        maxLength={BREACH_NOTE_MAX_LENGTH}
      />
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <div className="flex justify-end">
        <DoneButton
          step={step}
          isLoading={isLoading}
          onDone={() => complete({ id: breachId, step, note: note.trim() || undefined })}
        />
      </div>
    </div>
  );
}

/** The step to do now, with a note and the button that marks it done. Nothing for a closed breach. */
export function BreachStepCard({ breach }: { breach: BreachResponse }) {
  const t = useTranslations('breaches');
  const step = breach.currentStep;
  if (step === null) return null;

  return (
    <Card title={t('detail.stepTitle', { step: t(`steps.${step}`) })}>
      <StepForm key={step} breachId={breach.id} step={step} />
    </Card>
  );
}
