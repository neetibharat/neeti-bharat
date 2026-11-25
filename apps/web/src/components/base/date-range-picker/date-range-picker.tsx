'use client';

import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { parseDate, type DateValue } from '@internationalized/date';
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateRangePicker as AriaDateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
  RangeCalendar,
} from 'react-aria-components';
import { cx } from '@/lib/utils/cx';

/** Two days, YYYY-MM-DD, the last one included. */
export interface DayRange {
  start: string;
  end: string;
}

export interface RangePresetOption {
  id: string;
  label: string;
  range: DayRange;
}

export interface DateRangePickerProps {
  label: string;
  /** The chosen days, or null for none. */
  value: DayRange | null;
  onChange: (value: DayRange | null) => void;
  /** Shortcuts shown beside the calendar, such as "Last 30 days". Pass already-translated labels. */
  presets?: RangePresetOption[];
  /** The text of the button that empties the range. Pass already-translated text. */
  clearLabel: string;
  /** The name of the button that opens the calendar. Pass already-translated text. */
  openLabel: string;
  isDisabled?: boolean;
  className?: string;
}

const toRange = (value: DayRange | null) => {
  try {
    return value ? { start: parseDate(value.start), end: parseDate(value.end) } : null;
  } catch {
    return null;
  }
};

const fromRange = (value: { start: DateValue; end: DateValue } | null): DayRange | null =>
  value ? { start: value.start.toString(), end: value.end.toString() } : null;

const arrow =
  'grid size-8 cursor-pointer place-items-center rounded-control text-fg-muted outline-none hover:bg-surface-muted focus-visible:focus-ring';

const textButton =
  'cursor-pointer rounded-control px-2 py-1 text-left text-label font-medium text-brand outline-none hover:bg-brand-soft focus-visible:focus-ring';

/** One field for a stretch of days, with a calendar to drag across and shortcuts beside it. The end can never be before the start. */
export function DateRangePicker(props: DateRangePickerProps) {
  const { label, value, onChange, presets, clearLabel, openLabel, isDisabled, className } = props;

  return (
    <AriaDateRangePicker
      value={toRange(value)}
      onChange={(next) => onChange(fromRange(next))}
      isDisabled={isDisabled}
      className={cx('group flex flex-col gap-1.5', className)}
    >
      <Label className="text-label font-semibold text-fg">{label}</Label>
      <RangeField openLabel={openLabel} />
      <RangePopover presets={presets} clearLabel={clearLabel} onChange={onChange} />
    </AriaDateRangePicker>
  );
}

function Segments({ slot }: { slot: 'start' | 'end' }) {
  return (
    <DateInput slot={slot} className="flex items-center text-body text-fg">
      {(segment) => (
        <DateSegment
          segment={segment}
          className="rounded-sm px-0.5 tabular-nums outline-none data-focused:bg-brand data-focused:text-on-brand data-placeholder:text-fg-subtle"
        />
      )}
    </DateInput>
  );
}

/** The two typed dates, with the button that opens the calendar. */
function RangeField({ openLabel }: { openLabel: string }) {
  return (
    <Group className="flex h-10 w-full items-center gap-2 rounded-control bg-surface pr-1 pl-3 ring-1 ring-line-strong ring-inset focus-within:ring-2 focus-within:ring-accent group-data-disabled:bg-surface-muted">
      <div className="flex flex-1 items-center gap-1.5">
        <Segments slot="start" />
        <span aria-hidden="true" className="text-fg-subtle">
          –
        </span>
        <Segments slot="end" />
      </div>
      <AriaButton className={arrow} aria-label={openLabel}>
        <IconCalendar className="size-4" />
      </AriaButton>
    </Group>
  );
}

interface PopoverProps {
  presets?: RangePresetOption[];
  clearLabel: string;
  onChange: (value: DayRange | null) => void;
}

function RangePopover({ presets, clearLabel, onChange }: PopoverProps) {
  return (
    <Popover className="rounded-control border border-line bg-surface p-3 shadow-popover entering:animate-pop-in">
      <Dialog className="outline-none">
        {({ close }) => (
          <div className="flex gap-3">
            <div className="flex w-40 flex-col gap-0.5 border-r border-line pr-3">
              {presets?.map((preset) => (
                <AriaButton
                  key={preset.id}
                  className={textButton}
                  onPress={() => {
                    onChange(preset.range);
                    close();
                  }}
                >
                  {preset.label}
                </AriaButton>
              ))}
              <AriaButton
                className={cx(textButton, 'text-fg-muted')}
                onPress={() => {
                  onChange(null);
                  close();
                }}
              >
                {clearLabel}
              </AriaButton>
            </div>
            <RangeView />
          </div>
        )}
      </Dialog>
    </Popover>
  );
}

function RangeView() {
  return (
    <RangeCalendar className="w-64">
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
              className="mx-auto grid size-8 cursor-pointer place-items-center rounded-control text-label text-fg outline-none hover:bg-surface-muted data-focus-visible:focus-ring data-outside-month:text-fg-subtle data-selected:bg-brand-soft data-selected:text-brand data-selection-start:bg-brand data-selection-start:text-on-brand data-selection-end:bg-brand data-selection-end:text-on-brand data-unavailable:text-fg-subtle"
            />
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </RangeCalendar>
  );
}
