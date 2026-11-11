import type { ActivityEventResponse, AppRole } from '@dpdp-kit/shared';
import { isAppRole } from './guards';

export interface ParamWords {
  /** A role code in words. */
  role: (role: AppRole) => string;
  /** Any other value in words. */
  show: (value: unknown) => string;
  /** The name of the answer that changed. */
  entry: string;
}

/** The blanks of a log sentence. The event's own details come first, so they can never replace `entry`, `before` or `after`. */
export function sentenceParams(
  event: ActivityEventResponse,
  words: ParamWords,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(event.details ?? {})) {
    params[key] = key === 'role' && isAppRole(value) ? words.role(value) : words.show(value);
  }
  return {
    ...params,
    entry: words.entry,
    before: words.show(event.before?.value),
    after: words.show(event.after?.value),
  };
}
