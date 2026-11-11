'use client';

import type { ReactNode } from 'react';
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

export interface SwitchProps extends Omit<AriaSwitchProps, 'className' | 'children'> {
  children?: ReactNode;
  className?: string;
}

export function Switch({ children, className, ...props }: SwitchProps) {
  return (
    <AriaSwitch
      {...props}
      className={cx(
        'group flex cursor-pointer items-center gap-3 text-body text-fg',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60',
        className,
      )}
    >
      <span
        className={cx(
          'flex h-6 w-10 shrink-0 items-center rounded-full bg-line-strong p-0.5 transition-colors',
          'group-data-[selected]:bg-brand group-data-[focus-visible]:focus-ring',
        )}
      >
        <span className="block size-5 rounded-full bg-surface shadow-xs transition-transform group-data-[selected]:translate-x-4" />
      </span>
      {children}
    </AriaSwitch>
  );
}
