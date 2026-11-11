'use client';

import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { parseDate, type DateValue } from '@internationalized/date';
import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
} from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

export interface DatePickerProps {
  label?: string;
  /** A day as YYYY-MM-DD, or null for no date. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** The text of the button that empties the date. Pass already-translated text. */
  clearLabel: string;
  /** The name of the button that opens the calendar. Pass already-translated text. */
  openLabel: string;
  isDisabled?: boolean;
  className?: string;
}

const toDate = (value: string | null): DateValue | null => {
  try {
    return value ? parseDate(value) : null;
  } catch {
    return null;
  }
};

const arrow =
  'grid size-8 cursor-pointer place-items-center rounded-control text-fg-muted outline-none hover:bg-surface-muted focus-visible:focus-ring';

/** A date field with a calendar, in the same style as the other fields. Dates are YYYY-MM-DD. */
export function DatePicker({
  label,
  value,
  onChange,
  clearLabel,
  openLabel,
  isDisabled,
  className,
}: DatePickerProps) {
  return (
    <AriaDatePicker
      value={toDate(value)}
      onChange={(next) => onChange(next ? next.toString() : null)}
      isDisabled={isDisabled}
      className={cx('group flex flex-col gap-1.5', className)}
    >
      {label && <Label className="text-label font-semibold text-fg">{label}</Label>}
      <DateField openLabel={openLabel} />
      <CalendarPopover clearLabel={clearLabel} onClear={() => onChange(null)} />
    </AriaDatePicker>
  );
}

/** The typed date, with the button that opens the calendar. */
function DateField({ openLabel }: { openLabel: string }) {
  return (
    <Group className="flex h-10 w-full items-center gap-2 rounded-control bg-surface pr-1 pl-3 ring-1 ring-line-strong ring-inset focus-within:ring-2 focus-within:ring-accent group-data-disabled:bg-surface-muted">
      <DateInput className="flex flex-1 items-center text-body text-fg">
        {(segment) => (
          <DateSegment
            segment={segment}
            className="rounded-sm px-0.5 tabular-nums outline-none data-focused:bg-brand data-focused:text-on-brand data-placeholder:text-fg-subtle"
          />
        )}
      </DateInput>
      <AriaButton className={arrow} aria-label={openLabel}>
        <IconCalendar className="size-4" />
      </AriaButton>
    </Group>
  );
}

function CalendarPopover({ clearLabel, onClear }: { clearLabel: string; onClear: () => void }) {
  return (
    <Popover className="rounded-control border border-line bg-surface p-3 shadow-popover entering:animate-pop-in">
      <Dialog className="outline-none">
        {({ close }) => (
          <>
            <CalendarView />
            <div className="mt-2 flex justify-end border-t border-line pt-2">
              <AriaButton
                className="cursor-pointer rounded-control px-2 py-1 text-label font-medium text-brand outline-none hover:bg-brand-soft focus-visible:focus-ring"
                onPress={() => {
                  onClear();
                  close();
                }}
              >
                {clearLabel}
              </AriaButton>
            </div>
          </>
        )}
      </Dialog>
    </Popover>
  );
}

function CalendarView() {
  return (
    <Calendar className="w-64">
      <header className="mb-2 flex items-center justify-between">
        <AriaButton slot="previous" className={arrow}>
          <IconChevronLeft className="size-4" />
        </AriaButton>
        <Heading className="text-label font-semibold text-fg" />
        <AriaButton slot="next" className={arrow}>
          <IconChevronRight className="size-4" />
        </AriaButton>
      </header>
      <CalendarGrid className="w-full border-separate border-spacing-y-0.5">
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className="pb-1 text-caption font-medium text-fg-subtle">
              {day}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className="mx-auto grid size-8 cursor-pointer place-items-center rounded-control text-label text-fg outline-none hover:bg-surface-muted data-focus-visible:focus-ring data-outside-month:text-fg-subtle data-selected:bg-brand data-selected:text-on-brand data-selected:hover:bg-brand-hover data-unavailable:text-fg-subtle"
            />
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </Calendar>
  );
}
