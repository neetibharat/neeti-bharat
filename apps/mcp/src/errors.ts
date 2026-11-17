import { ApiError } from './client.js';

const MEANINGS: Readonly<Record<string, string>> = {
  VALIDATION_FAILED:
    'A field is empty, too long, not an allowed value, or points at something that does not exist.',
  FILE_REQUIRED: 'The upload had no file.',
  UNAUTHENTICATED: 'The API key is wrong, revoked or expired. The person needs to make a new one.',
  FORBIDDEN:
    'This key is not allowed to do that. Writing needs an admin or member key. Company answers and naming an approver need an admin key. Approving, sending back and reopening need the named approver, or an admin when nobody is named.',
  NOT_FOUND: 'That id does not exist, or the thing is archived.',
  CONFLICT:
    'The policy is not in a status that allows that, someone else just changed it, or the name is already used. Read it again.',
  CONFIRMATION_REQUIRED: 'A legal limit needs confirmed: true, once the person has agreed.',
  BUILT_IN: 'Built-in frameworks and rules are locked on this server.',
  HAS_CONTROLS: 'Its controls have to be archived first.',
  STORAGE_NOT_CONFIGURED: 'File uploads are not set up on this server.',
};

/** What a failed call says to Claude: the status and code, and what they mean in plain words. */
export function describeFailure(error: unknown): string {
  if (error instanceof ApiError) {
    const meaning = MEANINGS[error.code] ?? 'The API refused the request.';
    return `Not done. ${meaning} (${error.status} ${error.code}) Tell the person in plain words, and do not retry in a loop.`;
  }
  const reason = error instanceof Error ? error.message : String(error);
  return `Not done. ${reason}`;
}
