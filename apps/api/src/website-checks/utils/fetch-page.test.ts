import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FetchFailure, fetchPage, type FetchOptions } from './fetch-page';

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/redirect') return void res.writeHead(302, { location: '/page' }).end();
    if (req.url === '/loop') return void res.writeHead(302, { location: '/loop' }).end();
    if (req.url === '/inward')
      return void res.writeHead(302, { location: 'http://10.0.0.1/' }).end();
    if (req.url === '/slow') return;
    if (req.url === '/big') return void res.writeHead(200).end('x'.repeat(50_000));
    res.writeHead(200, { 'set-cookie': ['a=1'], 'x-test': 'yes' }).end('<html>hello</html>');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => void server.close());

// Tests visit a local server, so the rules about public addresses are switched off for them.
const open: FetchOptions = {
  timeoutMs: 2000,
  maxBytes: 10_000,
  maxRedirects: 3,
  isAllowedAddress: () => true,
  isAllowedUrl: (url) => url.hostname === '127.0.0.1',
};

describe('fetchPage', () => {
  it('reads the status, headers and body', async () => {
    const page = await fetchPage(new URL(`${base}/page`), open);
    expect(page.status).toBe(200);
    expect(page.headers['x-test']).toBe('yes');
    expect(page.body).toBe('<html>hello</html>');
    expect(page.tls).toBeUndefined();
  });

  it('follows a redirect and reports where it ended', async () => {
    const page = await fetchPage(new URL(`${base}/redirect`), open);
    expect(page.url.pathname).toBe('/page');
  });

  it('gives up on a redirect loop', async () => {
    await expect(fetchPage(new URL(`${base}/loop`), open)).rejects.toMatchObject({
      reason: 'too_many_redirects',
    });
  });

  it('refuses a redirect to an address it may not visit', async () => {
    await expect(fetchPage(new URL(`${base}/inward`), open)).rejects.toMatchObject({
      reason: 'not_allowed',
    });
  });

  it('stops reading at the size limit', async () => {
    const page = await fetchPage(new URL(`${base}/big`), { ...open, maxBytes: 1000 });
    expect(page.body).toHaveLength(1000);
  });

  it('times out on a page that never answers', async () => {
    await expect(
      fetchPage(new URL(`${base}/slow`), { ...open, timeoutMs: 200 }),
    ).rejects.toMatchObject({
      reason: 'timeout',
    });
  });

  it('reports a closed port as refused', async () => {
    await expect(fetchPage(new URL('http://127.0.0.1:1/'), open)).rejects.toBeInstanceOf(
      FetchFailure,
    );
  });
});

describe('fetchPage with the real rules', () => {
  it.each(['http://127.0.0.1/', 'http://10.1.2.3/', 'http://169.254.169.254/', 'http://[::1]/'])(
    'refuses to connect to %s',
    async (address) => {
      await expect(
        fetchPage(new URL(address), { timeoutMs: 2000, maxBytes: 1000, maxRedirects: 3 }),
      ).rejects.toMatchObject({ reason: 'not_allowed' });
    },
  );
});
