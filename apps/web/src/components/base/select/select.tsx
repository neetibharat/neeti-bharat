'use client';

import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import {
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  Button as AriaButton,
  type Key,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

export interface SelectOption<T extends string = string> {
  id: T;
  label: string;
}

export interface SelectProps<T extends string> extends Omit<
  AriaSelectProps<SelectOption<T>>,
  'className' | 'children' | 'onSelectionChange' | 'selectedKey' | 'defaultSelectedKey'
> {
  label?: string;
  options: SelectOption<T>[];
  selectedKey?: T | null;
  defaultSelectedKey?: T;
  onSelectionChange?: (id: T) => void;
  className?: string;
}

export function Select<T extends string>({
  label,
  options,
  className,
  onSelectionChange,
  ...props
}: SelectProps<T>) {
  // Looking the id up keeps the option type without a cast.
  const handleChange = (key: Key | null) => {
    const option = options.find((candidate) => candidate.id === key);
    if (option) onSelectionChange?.(option.id);
  };

  return (
    <AriaSelect
      {...props}
      onSelectionChange={handleChange}
      className={cx('group flex flex-col gap-1.5', className)}
    >
      {label && <Label className="text-label font-semibold text-fg">{label}</Label>}
      <AriaButton className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-control bg-surface px-3 text-body font-medium text-fg ring-1 ring-inset ring-line-strong outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <SelectValue className="min-w-0 flex-1 truncate text-left" />
        <IconChevronDown className="size-4 shrink-0 text-fg-subtle" />
      </AriaButton>
      <Popover className="w-(--trigger-width) overflow-y-auto rounded-control border border-line bg-surface p-1 shadow-popover entering:animate-pop-in exiting:animate-fade-out">
        <ListBox items={options} className="outline-none">
          {(option) => <Option option={option} />}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

function Option({ option }: { option: SelectOption }) {
  return (
    <ListBoxItem
      id={option.id}
      textValue={option.label}
      className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-body text-fg outline-none data-focused:bg-brand-soft"
    >
      {({ isSelected }) => (
        <>
          {option.label}
          {isSelected && <IconCheck className="size-4 text-brand" />}
        </>
      )}
    </ListBoxItem>
  );
}
