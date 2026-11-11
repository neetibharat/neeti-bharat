'use client';

import { IconCheck, IconMinus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps,
} from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

export interface CheckboxProps extends Omit<AriaCheckboxProps, 'className' | 'children'> {
  children?: ReactNode;
  className?: string;
}

export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      className={cx(
        'group flex cursor-pointer items-center gap-2.5 text-body text-fg',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60',
        className,
      )}
    >
      {({ isSelected, isIndeterminate }) => (
        <>
          <span
            className={cx(
              'grid size-4.5 shrink-0 place-items-center rounded-md bg-surface ring-1 ring-line-strong ring-inset',
              'group-data-[focus-visible]:focus-ring',
              (isSelected || isIndeterminate) && 'bg-brand ring-brand',
            )}
          >
            {isIndeterminate ? (
              <IconMinus className="size-3 text-on-brand" stroke={3} />
            ) : (
              isSelected && <IconCheck className="size-3 text-on-brand" stroke={3} />
            )}
          </span>
          {children}
        </>
      )}
    </AriaCheckbox>
  );
}
