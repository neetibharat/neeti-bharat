import type { BreachRow } from './breach-view';

/** What an edit sets, as far as a change is concerned. */
export interface BreachEdit {
  title: string;
  description: string;
  foundAt: Date;
  affectedSystems: string;
  affectedData: string;
  peopleAffected: number | null;
}

/** Whether an edit changes any of the details, so a save that only moves the assignee is not logged as an edit. */
export const detailsChanged = (current: BreachRow, edit: BreachEdit): boolean =>
  current.title !== edit.title ||
  current.description !== edit.description ||
  current.foundAt.getTime() !== edit.foundAt.getTime() ||
  current.affectedSystems !== edit.affectedSystems ||
  current.affectedData !== edit.affectedData ||
  current.peopleAffected !== edit.peopleAffected;
