import type { ReactNode } from 'react';
import { Button } from '@/components/base/button/button';

export interface FormActionsProps {
  cancelLabel: string;
  submitLabel: string;
  onCancel: () => void;
  /** Keeps Submit off until the required fields are filled. */
  isDisabled?: boolean;
  isLoading?: boolean;
  /** Shown on the left of the buttons, such as "Archive". */
  extra?: ReactNode;
}

/** The row under a form: Cancel and Submit on the right, an optional extra action on the left. */
export function FormActions(props: FormActionsProps) {
  const { cancelLabel, submitLabel, onCancel, isDisabled, isLoading, extra } = props;

  return (
    <div className="flex items-center justify-between gap-2">
      <div>{extra}</div>
      <div className="flex gap-2">
        <Button color="secondary" onPress={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" isDisabled={isDisabled} isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
