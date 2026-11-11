import type { WebsiteCheckResult } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { checkMessageKey, WEBSITE_MESSAGE_KEYS } from './website-check';

const key = (result: WebsiteCheckResult) => checkMessageKey(result);

describe('checkMessageKey', () => {
  it('is just the status when there is nothing more to say', () => {
    expect(key({ id: 'https', status: 'pass' })).toBe('pass');
    expect(key({ id: 'csp', status: 'warn', values: { reportOnly: 'no' } })).toBe('warn');
  });

  it('picks the sentence for the facts a result carries', () => {
    expect(key({ id: 'reachable', status: 'fail', values: { status: 503 } })).toBe('fail');
    expect(key({ id: 'reachable', status: 'fail', values: { reason: 'dns' } })).toBe('failReason');
    expect(key({ id: 'privacy_notice', status: 'fail', values: { found: 'no' } })).toBe('fail');
    expect(
      key({ id: 'privacy_notice', status: 'fail', values: { found: 'yes', why: '404' } }),
    ).toBe('failBroken');
    expect(key({ id: 'certificate', status: 'fail', values: { protocol: 'TLSv1.1' } })).toBe(
      'failProtocol',
    );
    expect(key({ id: 'certificate', status: 'pass', values: { protocol: 'TLSv1.3' } })).toBe(
      'passNoDate',
    );
    expect(
      key({ id: 'certificate', status: 'pass', values: { protocol: 'TLSv1.3', days: 80 } }),
    ).toBe('pass');
    expect(key({ id: 'grievance_contact', status: 'fail', values: { email: 'g@a.in' } })).toBe(
      'failMissing',
    );
    expect(key({ id: 'grievance_contact', status: 'fail' })).toBe('fail');
  });

  it('only ever picks a key that is listed for its check', () => {
    const samples: WebsiteCheckResult[] = [
      { id: 'reachable', status: 'pass', values: { status: 200 } },
      { id: 'http_redirect', status: 'warn', values: { outcome: 'unknown' } },
      { id: 'certificate', status: 'warn', values: { protocol: 'TLSv1.3', days: 3 } },
      { id: 'hsts', status: 'warn', values: { days: 1 } },
      { id: 'grievance_contact', status: 'warn', values: { email: 'dpo@a.in' } },
      { id: 'cookies', status: 'warn', values: { count: 2, names: 'a, b' } },
    ];
    for (const sample of samples) {
      expect(WEBSITE_MESSAGE_KEYS[sample.id]).toContain(key(sample));
    }
  });
});
