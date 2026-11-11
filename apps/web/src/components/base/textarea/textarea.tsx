'use client';

import {
  FieldError,
  Label,
  Text,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

export interface TextareaProps extends Omit<AriaTextFieldProps, 'className'> {
  label?: string;
  hint?: string;
  /** Message to show under the field. Pass already-translated text. */
  error?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function Textarea({
  label,
  hint,
  error,
  placeholder,
  rows = 4,
  className,
  ...props
}: TextareaProps) {
  return (
    <AriaTextField
      {...props}
      isInvalid={props.isInvalid || Boolean(error)}
      className={cx('group flex flex-col gap-1.5', className)}
    >
      {label && <Label className="text-label font-semibold text-fg">{label}</Label>}
      <AriaTextArea
        rows={rows}
        placeholder={placeholder}
        className={cx(
          'w-full resize-y rounded-control bg-surface px-3 py-2.5 text-body font-medium text-fg outline-none',
          'ring-1 ring-line-strong ring-inset placeholder:font-normal placeholder:text-fg-subtle',
          'focus:ring-2 focus:ring-accent group-data-[invalid]:ring-danger',
          'group-data-[disabled]:bg-surface-muted',
        )}
      />
      {hint && !error && (
        <Text slot="description" className="text-caption text-fg-subtle">
          {hint}
        </Text>
      )}
      {error && <FieldError className="text-caption text-danger">{error}</FieldError>}
    </AriaTextField>
  );
}
