/** Whether a session's role includes admin. Better Auth may store several roles as one comma-separated string. */
export function isAdmin(role: string | string[] | null | undefined): boolean {
  const roles = Array.isArray(role) ? role : String(role ?? '').split(',');
  return roles.map((r) => r.trim()).includes('admin');
}
