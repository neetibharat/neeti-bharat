import { AsyncLocalStorage } from 'node:async_hooks';
import type { AppRole } from '@neeti-bharat/shared';

/** Which organisation the current request works in, and the role the signed-in person has there. */
export interface OrgStore {
  organizationId?: string;
  role?: AppRole;
}

const orgContext = new AsyncLocalStorage<OrgStore>();

/** Gives the request a place to note its organisation. The guard fills it in once it knows who is asking. */
export function withOrgStore<T>(work: () => T): T {
  return orgContext.run({}, work);
}

/** Says which organisation the request works in. Everything stored or read afterwards is that organisation's. */
export function setOrganization(organizationId: string, role: AppRole): void {
  const store = orgContext.getStore();
  if (!store) throw new Error('There is no request to set an organisation on');
  store.organizationId = organizationId;
  store.role = role;
}

/** Runs `work` as one organisation, for jobs that belong to no request, such as setting up a new one. */
export function runInOrganization<T>(organizationId: string, work: () => T): T {
  return orgContext.run({ organizationId }, work);
}

/** The organisation the code is working in, or undefined outside one. */
export function organizationIdOrNull(): string | undefined {
  return orgContext.getStore()?.organizationId;
}

/** The organisation the code is working in. Reaching this with none is a bug, so it fails loudly. */
export function currentOrganizationId(): string {
  const id = organizationIdOrNull();
  if (!id) throw new Error('This code needs an organisation, and none is set for the request');
  return id;
}

export function currentRole(): AppRole | undefined {
  return orgContext.getStore()?.role;
}
