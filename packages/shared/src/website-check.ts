/** What a website check looks at, in the order they are listed. */
export const WEBSITE_CHECK_IDS = [
  'reachable',
  'https',
  'http_redirect',
  'certificate',
  'hsts',
  'csp',
  'content_type_options',
  'referrer_policy',
  'frame_options',
  'privacy_notice',
  'grievance_contact',
  'cookies',
] as const;

export type WebsiteCheckId = (typeof WEBSITE_CHECK_IDS)[number];

export const WEBSITE_CHECK_STATUSES = ['pass', 'warn', 'fail'] as const;
export type WebsiteCheckStatus = (typeof WEBSITE_CHECK_STATUSES)[number];

/** Why a site could not be read, when the check `reachable` fails. */
export const UNREACHABLE_REASONS = [
  'dns',
  'refused',
  'timeout',
  'certificate',
  'too_many_redirects',
  'not_allowed',
  'other',
] as const;
export type UnreachableReason = (typeof UNREACHABLE_REASONS)[number];

/** How many past checks the page lists at a time. */
export const WEBSITE_CHECK_PAGE_SIZE = 10;

export const WEBSITE_URL_MAX_LENGTH = 2000;

/** One thing checked. The words come from the web app; `values` fills in the numbers and names they quote. */
export interface WebsiteCheckResult {
  id: WebsiteCheckId;
  status: WebsiteCheckStatus;
  values?: Record<string, string | number>;
}

/** One run of the check, as listed. */
export interface WebsiteCheckSummary {
  id: string;
  url: string;
  checkedAt: string;
  checkedByName: string;
  passed: number;
  warned: number;
  failed: number;
}

/** One run with everything it found, from `GET /v1/website-checks/:id`. */
export interface WebsiteCheckResponse extends WebsiteCheckSummary {
  results: WebsiteCheckResult[];
}

/** The past runs, newest first, from `GET /v1/website-checks`. */
export interface WebsiteCheckListResponse {
  items: WebsiteCheckSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/** The address to check, with or without https://. */
export interface RunWebsiteCheckRequest {
  url: string;
}
