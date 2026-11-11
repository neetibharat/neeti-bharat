'use client';

import { ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

export interface SegmentedOption<T extends string = string> {
  id: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  className?: string;
}

/** A pill of two or three choices where exactly one is on, such as Board or List. */
export function SegmentedControl<T extends string = string>(props: SegmentedControlProps<T>) {
  const { options, value, onChange, className } = props;
  // Looking the id up keeps the option type without a cast.
  const handleChange = (keys: Set<unknown>) => {
    const picked = options.find((option) => keys.has(option.id));
    if (picked) onChange(picked.id);
  };

  return (
    <ToggleButtonGroup
      aria-label={props['aria-label']}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={handleChange}
      className={cx('inline-flex rounded-full bg-surface-muted p-0.5', className)}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.id}
          id={option.id}
          className={cx(
            'h-8 cursor-pointer rounded-full px-4 text-label font-semibold text-fg-muted outline-none transition-colors',
            'data-[hovered]:text-fg data-[selected]:bg-surface data-[selected]:text-fg data-[selected]:shadow-xs',
            'data-[focus-visible]:focus-ring',
          )}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
