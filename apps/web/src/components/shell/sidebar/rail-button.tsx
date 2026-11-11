'use client';

import type { Icon } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Button as AriaButton } from 'react-aria-components';
import { Tooltip } from '@/components/base/tooltip/tooltip';
import { cx } from '@/lib/utils/cx';

export interface RailButtonProps {
  label: string;
  icon: Icon;
  selected: boolean;
  onPress: () => void;
}

/** One icon in the rail. It names itself in a tooltip and slides a highlight to the selected one. */
export function RailButton({ label, icon: AreaIcon, selected, onPress }: RailButtonProps) {
  return (
    <Tooltip label={label} placement="right">
      <AriaButton
        aria-label={label}
        aria-pressed={selected}
        onPress={onPress}
        className={cx(
          'relative grid size-10 cursor-pointer place-items-center rounded-control transition-colors',
          'outline-none focus-visible:focus-ring',
          selected ? 'text-brand' : 'text-fg-subtle hover:bg-surface-muted hover:text-fg',
        )}
      >
        {selected && (
          <motion.span
            layoutId="rail-active"
            className="absolute inset-0 rounded-control bg-brand-soft"
            transition={{ type: 'spring', stiffness: 600, damping: 45 }}
          />
        )}
        <AreaIcon className="relative size-5" stroke={1.75} />
      </AriaButton>
    </Tooltip>
  );
}
