import { describe, expect, it, vi } from 'vitest';
import { FetchFailure, type PageResponse } from './fetch-page';
import { readPrivacy, tryHttp, type Fetcher } from './read-site';

const page = (url: string, over: Partial<PageResponse> = {}): PageResponse => ({
  url: new URL(url),
  status: 200,
  headers: {},
  body: '',
  ...over,
});

describe('tryHttp', () => {
  const start = new URL('https://acme.in/path');

  it('asks for the plain http address of the same host', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(page('https://acme.in/'));
    await tryHttp(start, fetcher);
    expect(fetcher.mock.calls[0]![0].href).toBe('http://acme.in/path');
  });

  it('says whether it leads to https or stays on http', async () => {
    expect(await tryHttp(start, async () => page('https://acme.in/'))).toBe('redirects_to_https');
    expect(await tryHttp(start, async () => page('http://acme.in/'))).toBe('served_over_http');
  });

  it('counts a refused or silent port as closed, and anything else as unknown', async () => {
    const failing =
      (reason: ConstructorParameters<typeof FetchFailure>[0]): Fetcher =>
      async () => {
        throw new FetchFailure(reason);
      };
    expect(await tryHttp(start, failing('refused'))).toBe('closed');
    expect(await tryHttp(start, failing('timeout'))).toBe('closed');
    expect(await tryHttp(start, failing('dns'))).toBeNull();
  });
});

describe('readPrivacy', () => {
  const home = (body: string) => page('https://acme.in/', { body });

  it('finds the link by its words or its address and reads it', async () => {
    const fetcher = vi
      .fn<Fetcher>()
      .mockResolvedValue(page('https://acme.in/legal/privacy', { status: 200 }));
    const found = await readPrivacy(home('<a href="/legal/privacy">Our policy</a>'), fetcher);
    expect(found).toMatchObject({ url: 'https://acme.in/legal/privacy', read: { status: 200 } });
    const byWords = await readPrivacy(home('<a href="/p">Privacy Policy</a>'), fetcher);
    expect(byWords.url).toBe('https://acme.in/p');
  });

  it('has no link to report when the page has none', async () => {
    expect(await readPrivacy(home('<a href="/about">About</a>'), vi.fn())).toEqual({ url: null });
  });

  it('skips in-page anchors', async () => {
    expect(await readPrivacy(home('<a href="#privacy">Privacy</a>'), vi.fn())).toEqual({
      url: null,
    });
  });

  it('reports why a link could not be read', async () => {
    const timeout: Fetcher = async () => {
      throw new FetchFailure('timeout');
    };
    expect(await readPrivacy(home('<a href="/privacy">Privacy</a>'), timeout)).toMatchObject({
      read: { reason: 'timeout' },
    });
    const unsafe = await readPrivacy(
      home('<a href="http://acme.in:8080/privacy">Privacy</a>'),
      vi.fn(),
    );
    expect(unsafe.read).toEqual({ reason: 'not_allowed' });
  });
});
