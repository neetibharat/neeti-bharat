import type { JobRole } from '@neeti-bharat/shared';

/** A change of owner. Nothing else on a control is picked by hand: its status is worked out. */
export interface OwnerChange {
  from: JobRole;
  to: JobRole;
}

/** What actually changes. A request that repeats the current owner changes nothing. */
export function planOwnerChange(
  currentOwner: JobRole,
  defaultOwner: JobRole,
  input: { ownerRole: JobRole | null },
): OwnerChange | null {
  const to = input.ownerRole ?? defaultOwner;
  return to === currentOwner ? null : { from: currentOwner, to };
}

/** What to write. Picking the default owner stores nothing, so a later change to the default still reaches it. */
export const storedOwner = (defaultOwner: JobRole, change: OwnerChange): JobRole | null =>
  change.to === defaultOwner ? null : change.to;
