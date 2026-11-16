import { Injectable } from '@nestjs/common';
import { fetchPage, type PageResponse } from '../utils/fetch-page';
import type { HttpOutcome, PrivacyPage } from '../utils/page-checks';
import { PAGE_OPTIONS, readPrivacy, tryHttp } from '../utils/read-site';

export interface SiteRead {
  home: PageResponse;
  httpOutcome: HttpOutcome;
  privacy: PrivacyPage;
}

/** Visits a site: its home page first, then the plain http:// address and the privacy policy side by side. */
@Injectable()
export class SiteReader {
  /** Throws `FetchFailure` when the home page cannot be read. */
  async read(url: URL): Promise<SiteRead> {
    const home = await fetchPage(url, PAGE_OPTIONS);
    const [httpOutcome, privacy] = await Promise.all([
      url.protocol === 'https:' ? tryHttp(url) : Promise.resolve<HttpOutcome>(null),
      readPrivacy(home),
    ]);
    return { home, httpOutcome, privacy };
  }
}
