import type { SessionUser } from './session-user';

type User = Pick<SessionUser, 'role'> | null;

/** Whether the person may change things. Nobody signed in, and auditors, may not. */
export const canEdit = (user: User): boolean => user !== null && user.role !== 'auditor';

export const isAdminUser = (user: User): boolean => user?.role === 'admin';

/** What the signed-in person may do. Nobody signed in may do nothing. */
export const permissionsOf = (user: User): { canEdit: boolean; isAdmin: boolean } => ({
  canEdit: canEdit(user),
  isAdmin: isAdminUser(user),
});
