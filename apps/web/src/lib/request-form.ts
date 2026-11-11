import type {
  CreateRequestRequest,
  RequestResponse,
  RequestSource,
  RequestType,
  UpdateRequestRequest,
} from '@dpdp-kit/shared';
import { fromFormMoment, toFormMoment } from './breach-form';

/** What the request form holds while it is being typed. The date is empty until one is picked. */
export interface RequestValues {
  type: RequestType;
  source: RequestSource;
  personName: string;
  personEmail: string;
  details: string;
  receivedDate: string | null;
  receivedTime: string;
  /** A person's id, or null for the DPO. */
  assigneeId: string | null;
}

/** A blank form for a request received just now, by hand. */
export function newRequestValues(now: Date = new Date()): RequestValues {
  const { date, time } = toFormMoment(now);
  return {
    type: 'access',
    source: 'manual',
    personName: '',
    personEmail: '',
    details: '',
    receivedDate: date,
    receivedTime: time,
    assigneeId: null,
  };
}

export function requestValuesOf(request: RequestResponse): RequestValues {
  const { date, time } = toFormMoment(new Date(request.receivedAt));
  return {
    type: request.type,
    source: request.source,
    personName: request.personName,
    personEmail: request.personEmail,
    details: request.details,
    receivedDate: date,
    receivedTime: time,
    assigneeId: request.assignee?.id ?? null,
  };
}

/** The request as it stands, as an edit that changes nothing: the base for changing one thing on the page. */
export function requestUpdateOf(request: RequestResponse): UpdateRequestRequest {
  return {
    type: request.type,
    personName: request.personName,
    personEmail: request.personEmail,
    details: request.details,
    assigneeId: request.assignee?.id ?? null,
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The request for what was typed, or null while a required field is empty or the email is not one. */
export function toUpdateRequest(values: RequestValues): UpdateRequestRequest | null {
  const personName = values.personName.trim();
  const personEmail = values.personEmail.trim();
  const details = values.details.trim();
  if (!personName || !details || !EMAIL.test(personEmail)) return null;
  return { type: values.type, personName, personEmail, details, assigneeId: values.assigneeId };
}

/** The request for logging a new one: the same, with where it came from and when it was received. */
export function toCreateRequest(values: RequestValues): CreateRequestRequest | null {
  const update = toUpdateRequest(values);
  const receivedAt = fromFormMoment(values.receivedDate, values.receivedTime);
  if (!update || !receivedAt) return null;
  return { ...update, source: values.source, receivedAt };
}
