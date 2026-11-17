import { ApiError } from './client.js';

const MEANINGS: Readonly<Record<string, string>> = {
  VALIDATION_FAILED:
    'A field is empty, too long, not an allowed value, or points at something that does not exist.',
  FILE_REQUIRED: 'The upload had no file.',
  UNAUTHENTICATED: 'The API key is wrong, revoked or expired. The person needs to make a new one.',
  FORBIDDEN: 'This key’s role is not allowed to do that. Writing needs an admin or member key.',
  NOT_FOUND: 'That id does not exist, or the thing is archived.',
  CONFLICT: 'A policy is not a draft, or someone else just changed it. Read it again.',
  BUILT_IN: 'A built-in framework or rule cannot be changed.',
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
