import type { UnreachableReason, WebsiteCheckResult, WebsiteCheckStatus } from '@dpdp-kit/shared';
import type { PageResponse } from './fetch-page';
import { emailsOf } from './html';

/** What happened when the plain http:// address was tried. Null when it could not be told. */
export type HttpOutcome = 'redirects_to_https' | 'served_over_http' | 'closed' | null;

export interface PrivacyPage {
  /** The address of the link found, or null when the page has none. */
  url: string | null;
  /** Its status code once read, or the reason it could not be read. */
  read?: { status: number } | { reason: UnreachableReason };
  page?: PageResponse;
}

/** Everything one run read, for the checks to judge. */
export interface Snapshot {
  home: PageResponse;
  httpOutcome: HttpOutcome;
  privacy: PrivacyPage;
  /** The grievance email in the company profile, or empty. */
  grievanceEmail: string;
  now: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HSTS_MIN_SECONDS = 15_552_000;
const CERT_WARN_DAYS = 14;
const GRIEVANCE_LOCAL_PART = /grievance|dpo|privacy|complaint|legal/;

type Check = (snapshot: Snapshot) => WebsiteCheckResult;

const result = (
  id: WebsiteCheckResult['id'],
  status: WebsiteCheckStatus,
  values?: WebsiteCheckResult['values'],
): WebsiteCheckResult => ({ id, status, ...(values && { values }) });

const header = (page: PageResponse, name: string): string => {
  const value = page.headers[name];
  return (Array.isArray(value) ? value.join(', ') : (value ?? '')).trim();
};

const isHttps = ({ home }: Snapshot): boolean => home.url.protocol === 'https:';

const reachable: Check = ({ home }) =>
  home.status < 400
    ? result('reachable', 'pass', { status: home.status })
    : result('reachable', 'fail', { status: home.status });

const https: Check = (snapshot) => result('https', isHttps(snapshot) ? 'pass' : 'fail');

const httpRedirect: Check = ({ httpOutcome }) => {
  if (httpOutcome === 'served_over_http') return result('http_redirect', 'fail');
  return result('http_redirect', httpOutcome === null ? 'warn' : 'pass', {
    outcome: httpOutcome ?? 'unknown',
  });
};

const certificate: Check = (snapshot) => {
  const { tls } = snapshot.home;
  if (!isHttps(snapshot) || !tls) return result('certificate', 'fail');
  const protocol = tls.protocol ?? 'unknown';
  if (!['TLSv1.2', 'TLSv1.3'].includes(protocol))
    return result('certificate', 'fail', { protocol });
  if (!tls.validTo) return result('certificate', 'pass', { protocol });
  const days = Math.floor((tls.validTo.getTime() - snapshot.now.getTime()) / DAY_MS);
  return result('certificate', days <= CERT_WARN_DAYS ? 'warn' : 'pass', { protocol, days });
};

const hsts: Check = (snapshot) => {
  const value = header(snapshot.home, 'strict-transport-security');
  if (!value || !isHttps(snapshot)) return result('hsts', 'fail');
  const seconds = Number(/max-age=(\d+)/i.exec(value)?.[1] ?? 0);
  return result('hsts', seconds >= HSTS_MIN_SECONDS ? 'pass' : 'warn', {
    days: Math.floor(seconds / 86_400),
  });
};

const csp: Check = ({ home }) => {
  if (header(home, 'content-security-policy')) return result('csp', 'pass');
  return result('csp', 'warn', {
    reportOnly: header(home, 'content-security-policy-report-only') ? 'yes' : 'no',
  });
};

const contentTypeOptions: Check = ({ home }) =>
  result(
    'content_type_options',
    header(home, 'x-content-type-options').toLowerCase() === 'nosniff' ? 'pass' : 'warn',
  );

const referrerPolicy: Check = ({ home }) =>
  result('referrer_policy', header(home, 'referrer-policy') ? 'pass' : 'warn');

const frameOptions: Check = ({ home }) => {
  const protectedFromFraming =
    header(home, 'x-frame-options') ||
    /frame-ancestors/i.test(header(home, 'content-security-policy'));
  return result('frame_options', protectedFromFraming ? 'pass' : 'warn');
};

/** Why a privacy notice link did not load: the reason it could not be read, or the status it answered with. */
const whyNotRead = (read: PrivacyPage['read']): string => {
  if (!read) return 'unknown';
  return 'reason' in read ? read.reason : String(read.status);
};

const privacyNotice: Check = ({ privacy }) => {
  if (!privacy.url) return result('privacy_notice', 'fail', { found: 'no' });
  const { read } = privacy;
  if (read && 'status' in read && read.status < 400) {
    return result('privacy_notice', 'pass', { url: privacy.url });
  }
  return result('privacy_notice', 'fail', {
    found: 'yes',
    url: privacy.url,
    why: whyNotRead(read),
  });
};

const grievanceContact: Check = ({ home, privacy, grievanceEmail }) => {
  const emails = emailsOf(`${home.body} ${privacy.page?.body ?? ''}`);
  const wanted = grievanceEmail.trim().toLowerCase();
  if (wanted) {
    return result('grievance_contact', emails.includes(wanted) ? 'pass' : 'fail', {
      email: wanted,
    });
  }
  const guess = emails.find((email) => GRIEVANCE_LOCAL_PART.test(email.split('@')[0] ?? ''));
  return guess
    ? result('grievance_contact', 'warn', { email: guess })
    : result('grievance_contact', 'fail');
};

const cookies: Check = ({ home }) => {
  const set = home.headers['set-cookie'] ?? [];
  if (!set.length) return result('cookies', 'pass');
  const names = set.map((cookie) => cookie.split('=')[0]?.trim() ?? '').filter(Boolean);
  return result('cookies', 'warn', { count: set.length, names: names.slice(0, 5).join(', ') });
};

const CHECKS: readonly Check[] = [
  reachable,
  https,
  httpRedirect,
  certificate,
  hsts,
  csp,
  contentTypeOptions,
  referrerPolicy,
  frameOptions,
  privacyNotice,
  grievanceContact,
  cookies,
];

/** Judges a page that was read, one result per check, in the order the report lists them. */
export function runChecks(snapshot: Snapshot): WebsiteCheckResult[] {
  return CHECKS.map((check) => check(snapshot));
}

/** When the page could not be read at all, that is the only finding. */
export function unreachable(reason: UnreachableReason): WebsiteCheckResult[] {
  return [result('reachable', 'fail', { reason })];
}

export function tally(results: readonly WebsiteCheckResult[]) {
  const count = (status: WebsiteCheckStatus) => results.filter((r) => r.status === status).length;
  return { passed: count('pass'), warned: count('warn'), failed: count('fail') };
}
