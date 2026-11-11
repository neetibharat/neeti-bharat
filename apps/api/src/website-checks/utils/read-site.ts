import { FetchFailure, fetchPage, type FetchOptions, type PageResponse } from './fetch-page';
import { linksOf } from './html';
import type { HttpOutcome, PrivacyPage } from './page-checks';
import { parseSiteUrl } from './site-url';

export type Fetcher = (url: URL, options: FetchOptions) => Promise<PageResponse>;

// Each page gets 5 seconds, and the second round runs side by side, so a whole check stays inside the 15 second
// limit of a request's database transaction.
const PAGE: FetchOptions = { timeoutMs: 5000, maxBytes: 1_000_000, maxRedirects: 4 };
const PRIVACY_LINK = /privacy|data[\s-]?protection/i;

/** How the plain http:// address answers. A closed or silent port counts as not served over http. */
export async function tryHttp(start: URL, fetcher: Fetcher = fetchPage): Promise<HttpOutcome> {
  const plain = new URL(start.href);
  plain.protocol = 'http:';
  plain.port = '';
  try {
    const page = await fetcher(plain, PAGE);
    return page.url.protocol === 'https:' ? 'redirects_to_https' : 'served_over_http';
  } catch (error) {
    const reason = error instanceof FetchFailure ? error.reason : 'other';
    return reason === 'refused' || reason === 'timeout' ? 'closed' : null;
  }
}

/** Finds the privacy policy link on the home page and reads it. */
export async function readPrivacy(
  home: PageResponse,
  fetcher: Fetcher = fetchPage,
): Promise<PrivacyPage> {
  const link = linksOf(home.body).find(
    (item) =>
      item.href &&
      !item.href.startsWith('#') &&
      (PRIVACY_LINK.test(item.text) || PRIVACY_LINK.test(item.href)),
  );
  if (!link) return { url: null };
  let target: URL;
  try {
    target = new URL(link.href, home.url);
  } catch {
    return { url: link.href, read: { reason: 'other' } };
  }
  if (!parseSiteUrl(target.href)) return { url: target.href, read: { reason: 'not_allowed' } };
  try {
    const page = await fetcher(target, PAGE);
    return { url: target.href, read: { status: page.status }, page };
  } catch (error) {
    return {
      url: target.href,
      read: { reason: error instanceof FetchFailure ? error.reason : 'other' },
    };
  }
}

export { PAGE as PAGE_OPTIONS };
