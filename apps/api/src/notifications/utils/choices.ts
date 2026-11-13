import type { AppRole, NotificationKind } from '@dpdp-kit/shared';

export interface Choice {
  inApp: boolean;
  email: boolean;
}

export interface ChoiceRow extends Choice {
  kind: NotificationKind;
}

/** What nobody has chosen about: on in both ways. */
export const ON: Choice = { inApp: true, email: true };

const key = (role: string, kind: NotificationKind): string => `${role}:${kind}`;

/** The choices of one person, and the defaults of every role, to be asked about a role and a kind. */
export function choiceResolver(
  personal: readonly ChoiceRow[],
  roleDefaults: readonly (ChoiceRow & { role: AppRole })[],
): (role: AppRole, kind: NotificationKind) => Choice {
  const mine = new Map(personal.map((row) => [row.kind, row]));
  const byRole = new Map(roleDefaults.map((row) => [key(row.role, row.kind), row]));
  // The person's own choice wins over their role's, which wins over "on".
  return (role, kind) => {
    const { inApp, email } = mine.get(kind) ?? byRole.get(key(role, kind)) ?? ON;
    return { inApp, email };
  };
}
