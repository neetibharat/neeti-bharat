import { createHash, randomBytes } from 'node:crypto';
import { API_KEY_PREFIX } from '@neeti-bharat/shared';

/** How much of a key is kept in the clear, after the fixed start, to tell keys apart. */
const SHOWN_CHARACTERS = 6;

export interface NewKeySecret {
  key: string;
  prefix: string;
  hash: string;
}

/** SHA-256 is enough because the key is 32 random bytes: there is nothing to guess and no need to slow a check down. */
export const hashKey = (key: string): string => createHash('sha256').update(key).digest('hex');

export function generateKey(): NewKeySecret {
  const key = `${API_KEY_PREFIX}${randomBytes(32).toString('hex')}`;
  return {
    key,
    prefix: key.slice(0, API_KEY_PREFIX.length + SHOWN_CHARACTERS),
    hash: hashKey(key),
  };
}
