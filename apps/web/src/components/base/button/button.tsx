'use client';

import { IconLoader2, type Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

type Size = 'sm' | 'md' | 'lg';
type Color = 'primary' | 'secondary' | 'soft' | 'tertiary' | 'danger';

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'children'> {
  size?: Size;
  color?: Color;
  iconLeading?: Icon;
  isLoading?: boolean;
  /** A square button with only an icon. Give it an aria-label. */
  isIconOnly?: boolean;
  className?: string;
  children?: ReactNode;
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-label',
  md: 'h-10 gap-2 px-4 text-body',
  lg: 'h-11 gap-2 px-5 text-subtitle',
};

const iconOnlySizes: Record<Size, string> = { sm: 'size-8', md: 'size-10', lg: 'size-11' };

const colors: Record<Color, string> = {
  primary: 'bg-brand text-on-brand shadow-pill hover:bg-brand-hover',
  secondary:
    'bg-surface text-fg ring-1 ring-inset ring-line-strong shadow-xs hover:bg-surface-muted',
  soft: 'bg-surface-muted text-fg shadow-soft hover:bg-line',
  tertiary: 'text-fg-muted hover:bg-surface-muted hover:text-fg',
  danger: 'bg-danger text-on-brand shadow-pill hover:opacity-90',
};

function buttonClasses({ size = 'md', color = 'primary', isIconOnly, className }: ButtonProps) {
  return cx(
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-semibold whitespace-nowrap',
    'transition-colors focus-visible:focus-ring',
    'disabled:cursor-not-allowed disabled:opacity-60',
    isIconOnly ? iconOnlySizes[size] : sizes[size],
    colors[color],
    className,
  );
}

function LeadingIcon({ icon: LeadIcon, isLoading }: { icon?: Icon; isLoading: boolean }) {
  const ShownIcon = isLoading ? IconLoader2 : LeadIcon;
  if (!ShownIcon) return null;
  return <ShownIcon className={cx('size-4 shrink-0', isLoading && 'animate-spin')} />;
}

export function Button(props: ButtonProps) {
  const {
    size,
    color,
    iconLeading,
    isLoading = false,
    isIconOnly,
    className,
    children,
    ...rest
  } = props;
  return (
    <AriaButton
      {...rest}
      isDisabled={rest.isDisabled || isLoading}
      className={buttonClasses({ size, color, isIconOnly, className })}
    >
      <LeadingIcon icon={iconLeading} isLoading={isLoading} />
      {children}
    </AriaButton>
  );
}
