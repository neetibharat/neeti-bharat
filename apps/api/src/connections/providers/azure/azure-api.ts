/** What an Azure connection signs in with. The client secret is never logged or sent anywhere but Microsoft. */
export interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
}

/** Reads from one Microsoft service. Only GET is offered: a connection looks, and changes nothing. */
export interface AzureEndpoint {
  get<T>(path: string): Promise<T>;
  /** Every item of a list, following the pages. */
  list<T>(path: string): Promise<T[]>;
}

export interface AzureApi {
  /** Azure Resource Manager: the subscription's resources. */
  arm: AzureEndpoint;
  /** Microsoft Graph: the directory (Entra ID). */
  graph: AzureEndpoint;
}

/** Microsoft did not accept the credentials. */
export class AzureSignInError extends Error {}
/** Signed in, but the app is not allowed to read this. Usually a role or a permission that has not been granted. */
export class AzureAccessError extends Error {}
/** Microsoft could not be reached, or answered with an error. */
export class AzureRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

const AUTHORITY = 'https://login.microsoftonline.com';
const HOSTS = {
  arm: { base: 'https://management.azure.com', scope: 'https://management.azure.com/.default' },
  graph: { base: 'https://graph.microsoft.com', scope: 'https://graph.microsoft.com/.default' },
} as const;
type Host = keyof typeof HOSTS;

const REQUEST_TIMEOUT_MS = 15_000;
/** A list is read to its end, up to this many pages, so a runaway one cannot keep a check busy. */
const MAX_PAGES = 20;
/** A token is renewed this long before it runs out. */
const TOKEN_MARGIN_MS = 60_000;

interface Token {
  value: string;
  expiresAt: number;
}

type Fetch = typeof fetch;

/** Talks to Microsoft with an app registration's credentials, asking for a token for each service the first time. */
export class HttpAzureApi implements AzureApi {
  readonly arm: AzureEndpoint = this.endpoint('arm');
  readonly graph: AzureEndpoint = this.endpoint('graph');
  private readonly tokens = new Map<Host, Token>();

  constructor(
    private readonly credentials: AzureCredentials,
    private readonly send: Fetch = fetch,
  ) {}

  /** Signs in and reads the subscription, to see that the details work before they are kept. */
  async verify(): Promise<void> {
    await this.arm.get(`/subscriptions/${this.credentials.subscriptionId}?api-version=2022-12-01`);
  }

  private endpoint(host: Host): AzureEndpoint {
    return {
      get: <T>(path: string) => this.request<T>(host, `${HOSTS[host].base}${path}`),
      list: <T>(path: string) => this.collect<T>(host, `${HOSTS[host].base}${path}`),
    };
  }

  private async collect<T>(host: Host, first: string): Promise<T[]> {
    const items: T[] = [];
    let url: string | undefined = first;
    for (let page = 0; url && page < MAX_PAGES; page += 1) {
      const body: ListPage<T> = await this.request<ListPage<T>>(host, url);
      items.push(...(body.value ?? []));
      url = this.sameHost(host, body.nextLink ?? body['@odata.nextLink']);
    }
    return items;
  }

  /** A next-page link is followed only when it stays on the same Microsoft service. */
  private sameHost(host: Host, link?: string): string | undefined {
    return link?.startsWith(`${HOSTS[host].base}/`) ? link : undefined;
  }

  private async request<T>(host: Host, url: string): Promise<T> {
    const response = await this.call(url, { authorization: `Bearer ${await this.token(host)}` });
    if (response.status === 401 || response.status === 403) {
      throw new AzureAccessError(`Not allowed (${response.status})`);
    }
    if (!response.ok)
      throw new AzureRequestError(`Azure answered ${response.status}`, response.status);
    return (await response.json()) as T;
  }

  private async token(host: Host): Promise<string> {
    const known = this.tokens.get(host);
    if (known && known.expiresAt - TOKEN_MARGIN_MS > Date.now()) return known.value;
    const { tenantId, clientId, clientSecret } = this.credentials;
    const response = await this.call(
      `${AUTHORITY}/${tenantId}/oauth2/v2.0/token`,
      { 'content-type': 'application/x-www-form-urlencoded' },
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: HOSTS[host].scope,
        grant_type: 'client_credentials',
      }),
    );
    if (response.status >= 400 && response.status < 500) {
      throw new AzureSignInError(`Microsoft refused the sign-in (${response.status})`);
    }
    if (!response.ok)
      throw new AzureRequestError(`Microsoft answered ${response.status}`, response.status);
    const body = (await response.json()) as { access_token: string; expires_in: number };
    this.tokens.set(host, {
      value: body.access_token,
      expiresAt: Date.now() + body.expires_in * 1000,
    });
    return body.access_token;
  }

  private async call(url: string, headers: Record<string, string>, body?: URLSearchParams) {
    try {
      return await this.send(url, {
        method: body ? 'POST' : 'GET',
        headers,
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new AzureRequestError('Microsoft could not be reached');
    }
  }
}

interface ListPage<T> {
  value?: T[];
  nextLink?: string;
  '@odata.nextLink'?: string;
}

/** A subscription the app registration can see. Only enabled ones are checkable, so only they are listed. */
export interface FoundSubscription {
  subscriptionId: string;
  displayName?: string;
  state?: string;
}

/** The app registration's own sign-in, before a subscription has been chosen. */
export type AzureApp = Omit<AzureCredentials, 'subscriptionId'>;

/** Answers the same read once per run, however many checks ask, so a list is fetched one time. */
export function cached(api: AzureApi): AzureApi {
  const wrap = (endpoint: AzureEndpoint, name: string): AzureEndpoint => {
    const seen = new Map<string, Promise<unknown>>();
    const once = <T>(kind: string, path: string, read: () => Promise<T>): Promise<T> => {
      const key = `${name}:${kind}:${path}`;
      if (!seen.has(key)) seen.set(key, read());
      return seen.get(key) as Promise<T>;
    };
    return {
      get: <T>(path: string) => once('get', path, () => endpoint.get<T>(path)),
      list: <T>(path: string) => once('list', path, () => endpoint.list<T>(path)),
    };
  };
  return { arm: wrap(api.arm, 'arm'), graph: wrap(api.graph, 'graph') };
}

/** Makes the client for a set of credentials. Tests replace it with one that never leaves the machine. */
export abstract class AzureConnector {
  abstract connect(credentials: AzureCredentials): AzureApi;
  /** Throws `AzureSignInError`, `AzureAccessError` or `AzureRequestError` when the details do not work. */
  abstract verify(credentials: AzureCredentials): Promise<void>;
  /** The enabled subscriptions the app can see. Throws like `verify` when the sign-in does not work. */
  abstract subscriptions(app: AzureApp): Promise<FoundSubscription[]>;
}

export class HttpAzureConnector extends AzureConnector {
  connect(credentials: AzureCredentials): AzureApi {
    return new HttpAzureApi(credentials);
  }

  verify(credentials: AzureCredentials): Promise<void> {
    return new HttpAzureApi(credentials).verify();
  }

  async subscriptions(app: AzureApp): Promise<FoundSubscription[]> {
    const api = new HttpAzureApi({ ...app, subscriptionId: '' });
    const all = await api.arm.list<FoundSubscription>('/subscriptions?api-version=2022-12-01');
    return all.filter((subscription) => subscription.state === 'Enabled');
  }
}
