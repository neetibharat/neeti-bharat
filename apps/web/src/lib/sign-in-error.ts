import { ERROR_CODES, type ErrorCode } from '@neeti-bharat/shared';

/**
 * Better Auth sends people back to sign-in with ?error=. It sends our own code when a hook refused them
 * (no invitation, or a left account), and `unable_to_create_user` when it could not make the account.
 */
export function signInErrorCode(error?: string): ErrorCode | undefined {
  if (!error) return undefined;
  if ((ERROR_CODES as readonly string[]).includes(error)) return error as ErrorCode;
  return error === 'unable_to_create_user' ? 'INVITATION_REQUIRED' : 'INTERNAL';
}
