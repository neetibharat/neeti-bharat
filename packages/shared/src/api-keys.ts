import { APP_ROLES, type AppRole } from './roles.js';

/** The header a key is sent in. */
export const API_KEY_HEADER = 'x-api-key';

/** Every key starts with this, so a leaked one can be recognised. */
export const API_KEY_PREFIX = 'dpdp_';

/** A key works with any role. Only a key cannot make or revoke keys, whatever its role. */
export const API_KEY_ROLES = APP_ROLES;
export type ApiKeyRole = AppRole;

/** How long a new key lasts, in days. Leaving it out makes a key that does not expire. */
export const API_KEY_LIFETIMES = [30, 90, 365] as const;

export const API_KEY_NAME_MAX_LENGTH = 80;
export const API_KEY_PAGE_SIZE = 10;
/** Keys that have not been revoked or run out, per organisation. */
export const API_KEY_ACTIVE_LIMIT = 25;

export interface ApiKeySummary {
  id: string;
  name: string;
  role: ApiKeyRole;
  /** The start of the key, enough to tell keys apart. The rest is never shown again. */
  prefix: string;
  createdByName: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface ApiKeyListResponse {
  items: ApiKeySummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateApiKeyRequest {
  name: string;
  role: ApiKeyRole;
  expiresInDays?: (typeof API_KEY_LIFETIMES)[number];
}

/** The only time the whole key is shown. */
export interface CreatedApiKeyResponse extends ApiKeySummary {
  key: string;
}
