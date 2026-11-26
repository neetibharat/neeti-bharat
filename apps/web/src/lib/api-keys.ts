import { API_KEY_LIFETIMES, type ApiKeySummary } from '@neeti-bharat/shared';

export type ApiKeyState = 'active' | 'revoked' | 'expired';

/** Whether a key still works: revoked wins over expired. */
export function keyState(key: ApiKeySummary, now = new Date()): ApiKeyState {
  if (key.revokedAt) return 'revoked';
  if (key.expiresAt && new Date(key.expiresAt) <= now) return 'expired';
  return 'active';
}

/** The choices for how long a new key lasts. `never` is a key that does not expire. */
export const EXPIRY_CHOICES = ['never', ...API_KEY_LIFETIMES.map(String)] as const;
export type ExpiryChoice = (typeof EXPIRY_CHOICES)[number];

/** The number of days a choice stands for, or undefined for a key that does not expire. */
export function lifetimeOf(choice: ExpiryChoice): (typeof API_KEY_LIFETIMES)[number] | undefined {
  return API_KEY_LIFETIMES.find((days) => String(days) === choice);
}
