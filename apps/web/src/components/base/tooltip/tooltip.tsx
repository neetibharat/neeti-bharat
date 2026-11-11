'use client';

import type { ReactNode } from 'react';
import { Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';

export interface TooltipProps {
  label: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  /** Must be focusable, for example a Button. */
  children: ReactNode;
}

export function Tooltip({ label, placement = 'top', children }: TooltipProps) {
  return (
    <TooltipTrigger delay={300}>
      {children}
      <AriaTooltip
        placement={placement}
        offset={8}
        className="max-w-xs rounded-lg bg-tooltip px-2.5 py-1.5 text-caption font-medium text-on-brand shadow-popover"
      >
        {label}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
