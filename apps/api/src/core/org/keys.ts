import { currentOrganizationId } from './org-context';

/** The key of a row that is identified by a catalogue id, such as `DPDP-R6-01`, which every organisation repeats. */
export function orgKey(id: string): { organizationId_id: { organizationId: string; id: string } } {
  return { organizationId_id: { organizationId: currentOrganizationId(), id } };
}

/** What a new row of an organisation must carry. */
export function orgOwned(): { organizationId: string } {
  return { organizationId: currentOrganizationId() };
}
