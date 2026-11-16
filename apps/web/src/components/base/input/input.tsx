'use client';

import type { Icon } from '@tabler/icons-react';
import {
  FieldError,
  Input as AriaInput,
  Label,
  Text,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

export interface InputProps extends Omit<AriaTextFieldProps, 'className'> {
  label?: string;
  hint?: string;
  /** Message to show under the field. Pass already-translated text. */
  error?: string;
  placeholder?: string;
  iconLeading?: Icon;
  className?: string;
}

const fieldClasses = cx(
  'flex w-full items-center gap-2 rounded-control bg-surface px-3 ring-1 ring-line-strong ring-inset',
  'focus-within:ring-2 focus-within:ring-accent',
  'group-data-[invalid]:ring-danger group-data-[disabled]:bg-surface-muted',
);

export function Input({
  label,
  hint,
  error,
  placeholder,
  iconLeading: IconLeading,
  className,
  ...props
}: InputProps) {
  return (
    <AriaTextField
      {...props}
      isInvalid={props.isInvalid || Boolean(error)}
      className={cx('group flex flex-col gap-1.5', className)}
    >
      {label && <Label className="text-label font-semibold text-fg">{label}</Label>}
      <div className={fieldClasses}>
        {IconLeading && <IconLeading className="size-4.5 shrink-0 text-fg-subtle" />}
        <AriaInput
          placeholder={placeholder}
          className="h-10 w-full bg-transparent text-body font-medium text-fg outline-none placeholder:font-normal placeholder:text-fg-subtle"
        />
      </div>
      {hint && !error && (
        <Text slot="description" className="text-caption text-fg-subtle">
          {hint}
        </Text>
      )}
      {error && <FieldError className="text-caption text-danger">{error}</FieldError>}
    </AriaTextField>
  );
}
