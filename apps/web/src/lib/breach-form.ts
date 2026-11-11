import type { BreachResponse, UpdateBreachRequest } from '@dpdp-kit/shared';

const pad = (value: number): string => String(value).padStart(2, '0');

/** A moment as the local date (YYYY-MM-DD) and time (HH:mm) a person types into the form. */
export function toFormMoment(value: Date): { date: string; time: string } {
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

/** The ISO moment for a local date and time typed into the form, or null when either is missing or not real. */
export function fromFormMoment(date: string | null, time: string): string | null {
  if (!date || !/^\d{2}:\d{2}$/.test(time)) return null;
  const moment = new Date(`${date}T${time}`);
  return Number.isNaN(moment.getTime()) ? null : moment.toISOString();
}

/** How many people, as the API wants it: blank means not known. Anything but a whole number is also not known. */
export function toPeopleAffected(text: string): number | null {
  const trimmed = text.trim();
  return /^\d{1,10}$/.test(trimmed) ? Number(trimmed) : null;
}

/** What the breach form holds while it is being typed. The date is empty until one is picked. */
export interface BreachValues {
  title: string;
  description: string;
  foundDate: string | null;
  foundTime: string;
  affectedSystems: string;
  affectedData: string;
  peopleAffected: string;
  /** A person's id, or null for the DPO. */
  assigneeId: string | null;
}

/** A blank form for a breach found just now. */
export function newBreachValues(now: Date = new Date()): BreachValues {
  const { date, time } = toFormMoment(now);
  return {
    title: '',
    description: '',
    foundDate: date,
    foundTime: time,
    affectedSystems: '',
    affectedData: '',
    peopleAffected: '',
    assigneeId: null,
  };
}

export function breachValuesOf(breach: BreachResponse): BreachValues {
  const { date, time } = toFormMoment(new Date(breach.foundAt));
  return {
    title: breach.title,
    description: breach.description,
    foundDate: date,
    foundTime: time,
    affectedSystems: breach.affectedSystems,
    affectedData: breach.affectedData,
    peopleAffected: breach.peopleAffected === null ? '' : String(breach.peopleAffected),
    assigneeId: breach.assignee?.id ?? null,
  };
}

/** The breach as it stands, as an edit that changes nothing: the base for changing one thing on the page. */
export function breachRequestOf(breach: BreachResponse): UpdateBreachRequest {
  return {
    title: breach.title,
    description: breach.description,
    foundAt: breach.foundAt,
    affectedSystems: breach.affectedSystems,
    affectedData: breach.affectedData,
    peopleAffected: breach.peopleAffected,
    assigneeId: breach.assignee?.id ?? null,
  };
}

/** The request for what was typed, or null while a required field is empty or the time is not real. */
export function toBreachRequest(values: BreachValues): UpdateBreachRequest | null {
  const foundAt = fromFormMoment(values.foundDate, values.foundTime);
  const required = [values.title, values.description, values.affectedSystems, values.affectedData];
  if (!foundAt || required.some((value) => value.trim() === '')) return null;
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    foundAt,
    affectedSystems: values.affectedSystems.trim(),
    affectedData: values.affectedData.trim(),
    peopleAffected: toPeopleAffected(values.peopleAffected),
    assigneeId: values.assigneeId,
  };
}
