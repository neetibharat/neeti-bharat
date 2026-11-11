import type { RequestRow } from './request-view';

/** What an edit sets, as far as a change is concerned. */
export type RequestEdit = Pick<RequestRow, 'type' | 'personName' | 'personEmail' | 'details'>;

/** Whether an edit changes any of the details, so a save that only moves the assignee is not logged as an edit. */
export const detailsChanged = (current: RequestRow, edit: RequestEdit): boolean =>
  current.type !== edit.type ||
  current.personName !== edit.personName ||
  current.personEmail !== edit.personEmail ||
  current.details !== edit.details;
