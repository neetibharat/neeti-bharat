import { createVerify, generateKeyPairSync } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { fakeGithub } from './checks/fake-github';
import {
  GithubAccessError,
  GithubNotFoundError,
  GithubSignInError,
  HttpGithubApi,
  appJwt,
  cachedGithub,
  nextPage,
  type GithubCredentials,
} from './github-api';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const credentials: GithubCredentials = { appId: '123', installationId: '456', privateKey };

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const TOKEN = {
  token: 'ghs_installation',
  expires_at: new Date(Date.now() + 3_600_000).toISOString(),
};

/** A fetch that answers from a list, in order, and remembers what it was asked. */
function fetchOf(...answers: Response[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const send = vi.fn((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = answers.shift();
    return next ? Promise.resolve(next) : Promise.reject(new Error('unexpected call'));
  });
  return { send: send as unknown as typeof fetch, calls };
}

describe('appJwt', () => {
  it('is signed with the private key, names the App, and lasts ten minutes at most', () => {
    const token = appJwt({ appId: '123', privateKey }, Date.UTC(2026, 0, 1));
    const [header, payload, signature] = token.split('.') as [string, string, string];
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({
      alg: 'RS256',
      typ: 'JWT',
    });
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      iss: string;
      iat: number;
      exp: number;
    };
    expect(claims.iss).toBe('123');
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(600);
    const ok = createVerify('RSA-SHA256')
      .update(`${header}.${payload}`)
      .verify(publicKey, Buffer.from(signature, 'base64url'));
    expect(ok).toBe(true);
  });

  it('says the key is no good when it cannot sign', () => {
    expect(() => appJwt({ appId: '1', privateKey: 'not a key' })).toThrow(GithubSignInError);
  });
});

describe('nextPage', () => {
  it('follows a next link on GitHub, and nothing else', () => {
    expect(
      nextPage(
        '<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=9>; rel="last"',
      ),
    ).toBe('https://api.github.com/x?page=2');
    expect(nextPage('<https://evil.example/x?page=2>; rel="next"')).toBeUndefined();
    expect(nextPage('<https://api.github.com/x?page=1>; rel="prev"')).toBeUndefined();
    expect(nextPage(null)).toBeUndefined();
  });
});

describe('HttpGithubApi', () => {
  it('signs in with the App for a token, and reads with that token', async () => {
    const { send, calls } = fetchOf(json(TOKEN, 201), json({ ok: true }));
    const result = await new HttpGithubApi(credentials, send).get('/repos/a/b');
    expect(result).toEqual({ ok: true });
    expect(calls[0]!.url).toBe('https://api.github.com/app/installations/456/access_tokens');
    expect(calls[0]!.init!.method).toBe('POST');
    const headers = calls[1]!.init!.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer ghs_installation');
    expect(calls[1]!.init!.method).toBe('GET');
  });

  it('only ever reads: the one POST is the request for a token', async () => {
    const { send, calls } = fetchOf(json(TOKEN, 201), json({}), json({}));
    const api = new HttpGithubApi(credentials, send);
    await api.get('/a');
    await api.get('/b');
    const posts = calls.filter((call) => call.init!.method !== 'GET');
    expect(posts).toHaveLength(1);
    expect(posts[0]!.url).toContain('/access_tokens');
  });

  it('follows pages, in a wrapped list too, but only on GitHub', async () => {
    const { send, calls } = fetchOf(
      json(TOKEN, 201),
      json({ repositories: [{ id: 1 }] }, 200, {
        link: '<https://api.github.com/installation/repositories?page=2>; rel="next"',
      }),
      json({ repositories: [{ id: 2 }] }, 200, {
        link: '<https://evil.example/installation/repositories?page=3>; rel="next"',
      }),
    );
    const items = await new HttpGithubApi(credentials, send).list(
      '/installation/repositories?per_page=100',
      'repositories',
    );
    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(calls.every((call) => call.url.startsWith('https://api.github.com/'))).toBe(true);
  });

  it('tells a refused App, a missing permission and a missing thing apart', async () => {
    const refused = fetchOf(json({}, 401));
    await expect(new HttpGithubApi(credentials, refused.send).get('/x')).rejects.toBeInstanceOf(
      GithubSignInError,
    );
    const forbidden = fetchOf(json(TOKEN, 201), json({}, 403));
    await expect(new HttpGithubApi(credentials, forbidden.send).get('/x')).rejects.toBeInstanceOf(
      GithubAccessError,
    );
    const missing = fetchOf(json(TOKEN, 201), json({}, 404));
    await expect(new HttpGithubApi(credentials, missing.send).get('/x')).rejects.toBeInstanceOf(
      GithubNotFoundError,
    );
  });

  it('gives the status of a yes-or-no read instead of failing on it', async () => {
    const { send } = fetchOf(json(TOKEN, 201), new Response(null, { status: 204 }), json({}, 404));
    const api = new HttpGithubApi(credentials, send);
    expect(await api.status('/repos/a/b/vulnerability-alerts')).toBe(204);
    expect(await api.status('/repos/a/c/vulnerability-alerts')).toBe(404);
  });

  it('says which account it is installed on', async () => {
    const { send, calls } = fetchOf(json({ account: { login: 'acme', type: 'Organization' } }));
    const account = await new HttpGithubApi(credentials, send).account();
    expect(account).toEqual({ login: 'acme', type: 'Organization' });
    expect(calls[0]!.url).toBe('https://api.github.com/app/installations/456');
  });

  it('lists each installation with the repositories it can see, by name', async () => {
    const { send } = fetchOf(
      json([{ id: 456, account: { login: 'acme', type: 'Organization' } }]),
      json(TOKEN, 201),
      json({
        repositories: [
          { full_name: 'acme/web', private: false },
          { full_name: 'acme/api', private: true },
        ],
      }),
    );
    const found = await new HttpGithubApi(
      { ...credentials, installationId: '' },
      send,
    ).installations();
    expect(found).toEqual([
      {
        id: '456',
        account: { login: 'acme', type: 'Organization' },
        repositories: [
          { name: 'acme/api', isPrivate: true },
          { name: 'acme/web', isPrivate: false },
        ],
      },
    ]);
  });
});

describe('cachedGithub', () => {
  it('reads the same thing once, however many checks ask', async () => {
    const api = fakeGithub({ lists: { '/x': [1] } });
    const spy = vi.spyOn(api, 'list');
    const cached = cachedGithub(api);
    await cached.list('/x');
    await cached.list('/x');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
