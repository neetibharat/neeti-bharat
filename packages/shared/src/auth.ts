import type { OrganizationSummary } from './organizations.js';

/** Which sign-in methods besides the email link are switched on, from `GET /v1/auth/providers`. */
export interface AuthProvidersResponse {
  google: boolean;
  microsoft: boolean;
}

/** The signed-in person, as returned by `GET /v1/me`. */
export interface MeResponse {
  id: string;
  name: string;
  email: string;
  /** Every organisation they can open, each with their role there. Empty until they join or make one. */
  organizations: OrganizationSummary[];
}
