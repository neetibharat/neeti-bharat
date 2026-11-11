/**
 * What a signed-in person can do. The first person to sign in is an admin.
 *  - admin:   everything, including people, connections, keys and secrets
 *  - member:  does the work: policies, data map, proof, requests and breaches
 *  - auditor: reads everything and changes nothing
 */
export const APP_ROLES = ['admin', 'member', 'auditor'] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** Access as shown on a person: a login role, or `staff` for someone with no login at all. */
export const ACCESS_LEVELS = [...APP_ROLES, 'staff'] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];
