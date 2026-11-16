import type { ActivityEventResponse, AppRole, BreachStep, RequestType } from '@dpdp-kit/shared';
import { isAppRole, isBreachStep, isRequestType } from './guards';

export interface ParamWords {
  /** A role code in words. */
  role: (role: AppRole) => string;
  /** A breach step code in words. */
  step: (step: BreachStep) => string;
  /** A request type code in words. */
  requestType: (type: RequestType) => string;
  /** Any other value in words. */
  show: (value: unknown) => string;
  /** The name of the answer that changed. */
  entry: string;
}

function detailWords(key: string, value: unknown, words: ParamWords): string {
  if (key === 'role' && isAppRole(value)) return words.role(value);
  if (key === 'step' && isBreachStep(value)) return words.step(value);
  if (key === 'type' && isRequestType(value)) return words.requestType(value);
  return words.show(value);
}

/** The blanks of a log sentence. The event's own details come first, so they can never replace `entry`, `before` or `after`. */
export function sentenceParams(
  event: ActivityEventResponse,
  words: ParamWords,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(event.details ?? {})) {
    params[key] = detailWords(key, value, words);
  }
  return {
    ...params,
    entry: words.entry,
    before: words.show(event.before?.value),
    after: words.show(event.after?.value),
  };
}
