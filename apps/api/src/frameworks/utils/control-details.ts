import type { ControlDetailsInput } from '../dto/control.dto';
import type { ControlWithLinks } from '../repositories/control.repository';
import { day } from './dates';

export interface DetailsChange {
  /** The text, review date or policies changed. */
  edited: boolean;
  /** Set when the person on the control changed: `from` is their name, `toId` the new person's id. */
  assignee: { from: string | null; toId: string | null } | null;
}

/** The policies must match one for one, in the same order: the first is the primary. */
function samePolicies(current: ControlWithLinks, policyIds: string[]): boolean {
  return (
    current.policies.length === policyIds.length &&
    current.policies.every((link, index) => link.policyId === policyIds[index])
  );
}

function sameText(current: ControlWithLinks, input: ControlDetailsInput): boolean {
  return (
    current.title === input.title &&
    current.description === input.description &&
    day(current.reviewDate) === input.reviewDate
  );
}

/** What a save actually changes. Saving the same details again changes nothing. */
export function diffDetails(current: ControlWithLinks, input: ControlDetailsInput): DetailsChange {
  const sameAssignee = (current.assigneeId ?? null) === input.assigneeId;
  return {
    edited: !sameText(current, input) || !samePolicies(current, input.policyIds),
    assignee: sameAssignee
      ? null
      : { from: current.assignee?.name ?? null, toId: input.assigneeId },
  };
}
