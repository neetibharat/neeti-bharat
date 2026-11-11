import { describe, expect, it } from 'vitest';
import type { PageResponse } from './fetch-page';
import { runChecks, tally, unreachable, type Snapshot } from './page-checks';

const NOW = new Date('2026-11-11T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

const page = (over: Partial<PageResponse> = {}): PageResponse => ({
  url: new URL('https://acme.in/'),
  status: 200,
  headers: {},
  body: '',
  tls: { protocol: 'TLSv1.3', validTo: new Date(NOW.getTime() + 90 * DAY) },
  ...over,
});

const GOOD_HEADERS = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'content-security-policy': "default-src 'self'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
};

const snapshot = (over: Partial<Snapshot> = {}): Snapshot => ({
  home: page({ headers: GOOD_HEADERS, body: 'write to grievance@acme.in' }),
  httpOutcome: 'redirects_to_https',
  privacy: { url: 'https://acme.in/privacy', read: { status: 200 } },
  grievanceEmail: 'grievance@acme.in',
  now: NOW,
  ...over,
});

const byId = (s: Snapshot) => Object.fromEntries(runChecks(s).map((r) => [r.id, r]));

describe('runChecks', () => {
  it('passes a site that does everything right, with one result per check in order', () => {
    const results = runChecks(snapshot());
    expect(results.map((r) => r.id)).toHaveLength(12);
    expect(results.every((r) => r.status === 'pass')).toBe(true);
    expect(tally(results)).toEqual({ passed: 12, warned: 0, failed: 0 });
  });

  it('fails a page that answers with an error status', () => {
    expect(byId(snapshot({ home: page({ status: 503 }) })).reachable).toMatchObject({
      status: 'fail',
      values: { status: 503 },
    });
  });

  it('fails a site served over plain http, and everything that depends on https', () => {
    const found = byId(
      snapshot({ home: page({ url: new URL('http://acme.in/'), tls: undefined }) }),
    );
    expect(found.https!.status).toBe('fail');
    expect(found.certificate!.status).toBe('fail');
    expect(found.hsts!.status).toBe('fail');
  });

  it('judges what the plain http address does', () => {
    expect(byId(snapshot({ httpOutcome: 'served_over_http' })).http_redirect!.status).toBe('fail');
    expect(byId(snapshot({ httpOutcome: 'closed' })).http_redirect!.status).toBe('pass');
    expect(byId(snapshot({ httpOutcome: null })).http_redirect!.status).toBe('warn');
  });

  it('warns when the certificate is close to running out, and fails an old TLS version', () => {
    const soon = page({
      headers: GOOD_HEADERS,
      tls: { protocol: 'TLSv1.3', validTo: new Date(NOW.getTime() + 5 * DAY) },
    });
    expect(byId(snapshot({ home: soon })).certificate).toMatchObject({
      status: 'warn',
      values: { days: 5 },
    });
    const old = page({ headers: GOOD_HEADERS, tls: { protocol: 'TLSv1.1', validTo: null } });
    expect(byId(snapshot({ home: old })).certificate).toMatchObject({
      status: 'fail',
      values: { protocol: 'TLSv1.1' },
    });
  });

  it('warns on a short HSTS lifetime and fails a missing one', () => {
    const short = page({
      headers: { ...GOOD_HEADERS, 'strict-transport-security': 'max-age=300' },
    });
    expect(byId(snapshot({ home: short })).hsts!.status).toBe('warn');
    const none = page({ headers: { ...GOOD_HEADERS, 'strict-transport-security': undefined } });
    expect(byId(snapshot({ home: none })).hsts!.status).toBe('fail');
  });

  it('warns for each missing security header, and accepts frame-ancestors for framing', () => {
    const bare = byId(snapshot({ home: page({ body: 'grievance@acme.in' }) }));
    expect(
      ['csp', 'content_type_options', 'referrer_policy', 'frame_options'].map(
        (id) => bare[id]!.status,
      ),
    ).toEqual(['warn', 'warn', 'warn', 'warn']);
    const framed = page({ headers: { 'content-security-policy': "frame-ancestors 'none'" } });
    expect(byId(snapshot({ home: framed })).frame_options!.status).toBe('pass');
  });

  it('fails a missing privacy notice or one that does not load', () => {
    expect(byId(snapshot({ privacy: { url: null } })).privacy_notice!.status).toBe('fail');
    const broken = byId(
      snapshot({ privacy: { url: 'https://acme.in/privacy', read: { status: 404 } } }),
    );
    expect(broken.privacy_notice).toMatchObject({ status: 'fail', values: { why: '404' } });
    const down = byId(
      snapshot({ privacy: { url: 'https://acme.in/privacy', read: { reason: 'timeout' } } }),
    );
    expect(down.privacy_notice!.values).toMatchObject({ why: 'timeout' });
  });

  it('matches the grievance email in the profile, case-insensitively, on the home or privacy page', () => {
    const onPrivacy = snapshot({
      home: page({ headers: GOOD_HEADERS, body: 'nothing' }),
      grievanceEmail: 'Grievance@Acme.in',
      privacy: {
        url: 'https://acme.in/privacy',
        read: { status: 200 },
        page: page({ body: 'mail GRIEVANCE@acme.in' }),
      },
    });
    expect(byId(onPrivacy).grievance_contact!.status).toBe('pass');
    const missing = snapshot({ home: page({ headers: GOOD_HEADERS, body: 'other@acme.in' }) });
    expect(byId(missing).grievance_contact).toMatchObject({
      status: 'fail',
      values: { email: 'grievance@acme.in' },
    });
  });

  it('with no email in the profile, warns about a likely one and fails when there is none', () => {
    const guessed = snapshot({
      grievanceEmail: '',
      home: page({ headers: GOOD_HEADERS, body: 'dpo@acme.in' }),
    });
    expect(byId(guessed).grievance_contact).toMatchObject({
      status: 'warn',
      values: { email: 'dpo@acme.in' },
    });
    const none = snapshot({
      grievanceEmail: '',
      home: page({ headers: GOOD_HEADERS, body: 'hello' }),
    });
    expect(byId(none).grievance_contact!.status).toBe('fail');
  });

  it('warns about cookies set before anyone has agreed, naming up to five', () => {
    const cookies = page({
      headers: {
        ...GOOD_HEADERS,
        'set-cookie': ['_ga=1; Path=/', 'sid=2', 'a=1', 'b=1', 'c=1', 'd=1'],
      },
      body: 'grievance@acme.in',
    });
    expect(byId(snapshot({ home: cookies })).cookies).toMatchObject({
      status: 'warn',
      values: { count: 6, names: '_ga, sid, a, b, c' },
    });
  });
});

describe('unreachable', () => {
  it('is a single failed result with the reason', () => {
    expect(unreachable('dns')).toEqual([
      { id: 'reachable', status: 'fail', values: { reason: 'dns' } },
    ]);
  });
});
