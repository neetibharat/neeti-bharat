import { describe, expect, it, vi } from 'vitest';
import {
  AzureAccessError,
  AzureRequestError,
  AzureSignInError,
  HttpAzureApi,
  cached,
  type AzureCredentials,
} from './azure-api';
import { fakeAzure } from './checks/fake-azure';

const credentials: AzureCredentials = {
  tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  clientId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  clientSecret: 'the-secret-value',
  subscriptionId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const TOKEN = { access_token: 'token-1', expires_in: 3600 };

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

describe('HttpAzureApi', () => {
  it('signs in with the app’s credentials for the service it reads, and reads with the token', async () => {
    const { send, calls } = fetchOf(json(TOKEN), json({ ok: true }));
    const result = await new HttpAzureApi(credentials, send).arm.get(
      '/subscriptions/x?api-version=1',
    );
    expect(result).toEqual({ ok: true });
    expect(calls[0]!.url).toBe(
      `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`,
    );
    const form = new URLSearchParams(String(calls[0]!.init!.body));
    expect(form.get('grant_type')).toBe('client_credentials');
    expect(form.get('scope')).toBe('https://management.azure.com/.default');
    expect(calls[1]!.url).toBe('https://management.azure.com/subscriptions/x?api-version=1');
    expect((calls[1]!.init!.headers as Record<string, string>).authorization).toBe(
      'Bearer token-1',
    );
  });

  it('only ever reads: every call to a service is a GET', async () => {
    const { send, calls } = fetchOf(json(TOKEN), json({}));
    await new HttpAzureApi(credentials, send).graph.get('/v1.0/policies/x');
    expect(calls[1]!.init!.method).toBe('GET');
  });

  it('asks for one token per service and keeps it', async () => {
    const { send, calls } = fetchOf(json(TOKEN), json({}), json({}));
    const api = new HttpAzureApi(credentials, send);
    await api.arm.get('/a');
    await api.arm.get('/b');
    expect(calls.filter((call) => call.url.includes('/oauth2/'))).toHaveLength(1);
  });

  it('follows pages, but only on the same Microsoft service', async () => {
    const { send, calls } = fetchOf(
      json(TOKEN),
      json({ value: [1, 2], nextLink: 'https://management.azure.com/next?page=2' }),
      json({ value: [3], nextLink: 'https://evil.example/steal' }),
    );
    expect(await new HttpAzureApi(credentials, send).arm.list('/things')).toEqual([1, 2, 3]);
    expect(calls.map((call) => call.url).some((url) => url.includes('evil.example'))).toBe(false);
  });

  it('follows Graph’s own next-page link', async () => {
    const { send } = fetchOf(
      json(TOKEN),
      json({ value: ['a'], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/users?$skip=1' }),
      json({ value: ['b'] }),
    );
    expect(await new HttpAzureApi(credentials, send).graph.list('/v1.0/users')).toEqual(['a', 'b']);
  });

  it('says when Microsoft refuses the credentials, without repeating them', async () => {
    const { send } = fetchOf(json({ error: 'invalid_client' }, 401));
    const failure = await new HttpAzureApi(credentials, send).arm
      .get('/a')
      .catch((error: Error) => error);
    expect(failure).toBeInstanceOf(AzureSignInError);
    expect(String((failure as Error).message)).not.toContain(credentials.clientSecret);
  });

  it('says when the app is not allowed to read something', async () => {
    const { send } = fetchOf(json(TOKEN), json({}, 403));
    await expect(new HttpAzureApi(credentials, send).arm.get('/a')).rejects.toBeInstanceOf(
      AzureAccessError,
    );
  });

  it('says when Microsoft cannot be reached or answers with an error', async () => {
    const down = vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch;
    await expect(new HttpAzureApi(credentials, down).arm.get('/a')).rejects.toBeInstanceOf(
      AzureRequestError,
    );
    const { send } = fetchOf(json(TOKEN), json({}, 500));
    await expect(new HttpAzureApi(credentials, send).arm.get('/a')).rejects.toMatchObject({
      status: 500,
    });
  });

  it('verify reads the subscription', async () => {
    const { send, calls } = fetchOf(
      json(TOKEN),
      json({ subscriptionId: credentials.subscriptionId }),
    );
    await new HttpAzureApi(credentials, send).verify();
    expect(calls[1]!.url).toContain(`/subscriptions/${credentials.subscriptionId}?api-version=`);
  });
});

describe('cached', () => {
  it('asks Azure once for a read however many checks want it', async () => {
    const inner = fakeAzure({ arm: { things: [1, 2] } });
    const list = vi.spyOn(inner.arm, 'list');
    const shared = cached(inner);
    await Promise.all([shared.arm.list('/things'), shared.arm.list('/things')]);
    expect(list).toHaveBeenCalledTimes(1);
  });
});
