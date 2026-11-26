import type { WebsiteCheckId, WebsiteCheckResult } from '@neeti-bharat/shared';

/**
 * The messages a result can use, under `websiteCheck.checks.<id>.` in en.json. A result is `<status>`, with a suffix
 * when it carries other facts that change what is worth saying.
 */
export const WEBSITE_MESSAGE_KEYS: Readonly<Record<WebsiteCheckId, readonly string[]>> = {
  reachable: ['pass', 'fail', 'failReason'],
  https: ['pass', 'fail'],
  http_redirect: ['pass', 'warn', 'fail'],
  certificate: ['pass', 'passNoDate', 'warn', 'fail', 'failProtocol'],
  hsts: ['pass', 'warn', 'fail'],
  csp: ['pass', 'warn'],
  content_type_options: ['pass', 'warn'],
  referrer_policy: ['pass', 'warn'],
  frame_options: ['pass', 'warn'],
  privacy_notice: ['pass', 'fail', 'failBroken'],
  grievance_contact: ['pass', 'warn', 'fail', 'failMissing'],
  cookies: ['pass', 'warn'],
};

// A variant applies when its test holds for the result. The first that does is used.
const VARIANTS: readonly (readonly [string, (result: WebsiteCheckResult) => boolean])[] = [
  ['Reason', ({ values = {} }) => 'reason' in values],
  ['Broken', ({ id, values = {} }) => id === 'privacy_notice' && values.found === 'yes'],
  [
    'Protocol',
    ({ id, status, values = {} }) =>
      id === 'certificate' && status === 'fail' && 'protocol' in values,
  ],
  [
    'NoDate',
    ({ id, status, values = {} }) =>
      id === 'certificate' && status === 'pass' && !('days' in values),
  ],
  [
    'Missing',
    ({ id, status, values = {} }) =>
      id === 'grievance_contact' && status === 'fail' && 'email' in values,
  ],
];

const variantOf = (result: WebsiteCheckResult): string =>
  VARIANTS.find(([, applies]) => applies(result))?.[0] ?? '';

/** How the report is grouped, in the order shown: what DPDP asks to see first, then the technical checks. */
export const CHECK_GROUPS: readonly { id: string; checks: readonly WebsiteCheckId[] }[] = [
  { id: 'privacy', checks: ['privacy_notice', 'grievance_contact', 'cookies'] },
  { id: 'connection', checks: ['reachable', 'https', 'http_redirect', 'certificate', 'hsts'] },
  { id: 'browser', checks: ['csp', 'content_type_options', 'referrer_policy', 'frame_options'] },
];

/** The key, inside `websiteCheck.checks.<id>`, of the sentence that says what this result found. */
export function checkMessageKey(result: WebsiteCheckResult): string {
  const variant = variantOf(result);
  return variant === 'NoDate' ? 'passNoDate' : `${result.status}${variant}`;
}
