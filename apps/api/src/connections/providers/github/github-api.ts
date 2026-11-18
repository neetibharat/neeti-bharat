import { createPrivateKey, createSign } from 'node:crypto';

/** The GitHub App that signs in: its ID, and the private key it proves itself with. The key is never logged or sent anywhere but GitHub. */
export interface GithubApp {
  appId: string;
  privateKey: string;
}

/** An App installed on one account: what a connection signs in with. */
export interface GithubCredentials extends GithubApp {
  installationId: string;
}

/** The organisation or person the App is installed on. */
export interface GithubAccount {
  login: string;
  type: 'Organization' | 'User';
}

/** Reads from GitHub. Only GET is offered: a connection looks, and changes nothing. */
export interface GithubApi {
  get<T>(path: string): Promise<T>;
  /** Every item of a list, following the pages. `key` names the array when GitHub wraps the list in an object. */
  list<T>(path: string, key?: string): Promise<T[]>;
  /** The status of a read whose answer is yes or no, such as 204 for on and 404 for off. */
  status(path: string): Promise<number>;
}

/** GitHub did not accept the App ID and private key. */
export class GithubSignInError extends Error {}
/** Signed in, but the App is not allowed to read this: a permission it was not given, or a plan that lacks the feature. */
export class GithubAccessError extends Error {}
/** There is nothing at that address, which for some reads is the answer: no protection rule, no code scanning. */
export class GithubNotFoundError extends Error {}
/** GitHub could not be reached, or answered with an error. */
export class GithubRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export interface GithubRepositoryInfo {
  name: string;
  isPrivate: boolean;
}

export interface GithubInstallationInfo {
  id: string;
  account: GithubAccount;
  repositories: GithubRepositoryInfo[];
}

const BASE = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15_000;
/** A list is read to its end, up to this many pages, so a runaway one cannot keep a check busy. */
const MAX_PAGES = 20;
/** A token is renewed this long before it runs out. */
const TOKEN_MARGIN_MS = 60_000;
/** The most installations one discovery reads the repositories of. */
const MAX_INSTALLATIONS = 10;

interface Token {
  value: string;
  expiresAt: number;
}

type Fetch = typeof fetch;

const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');

/** What the App proves itself with for ten minutes at most: a message signed with its private key. */
export function appJwt({ appId, privateKey }: GithubApp, now: number = Date.now()): string {
  const seconds = Math.floor(now / 1000);
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iat: seconds - 60,
    exp: seconds + 540,
    iss: appId,
  })}`;
  try {
    const signature = createSign('RSA-SHA256')
      .update(unsigned)
      .sign(createPrivateKey(privateKey))
      .toString('base64url');
    return `${unsigned}.${signature}`;
  } catch {
    throw new GithubSignInError('The private key is not one that can sign');
  }
}

/** The address of the next page, when it stays on GitHub's own API. */
export function nextPage(link: string | null): string | undefined {
  const next = link?.split(',').find((part) => /rel="next"/.test(part));
  const url = next?.match(/<([^>]+)>/)?.[1];
  return url?.startsWith(`${BASE}/`) ? url : undefined;
}

/** Talks to GitHub as an App installed on an account, asking for a short-lived token the first time. */
export class HttpGithubApi implements GithubApi {
  private token: Token | undefined;

  constructor(
    private readonly credentials: GithubCredentials,
    private readonly send: Fetch = fetch,
  ) {}

  /** Signs in and reads the repositories, to see that the details work before they are kept. */
  async verify(): Promise<GithubAccount> {
    await this.get('/installation/repositories?per_page=1');
    return this.account();
  }

  /** The account the App is installed on. */
  async account(): Promise<GithubAccount> {
    const found = await this.getWith<{ account?: { login?: string; type?: string } }>(
      `/app/installations/${this.credentials.installationId}`,
      appJwt(this.credentials),
    );
    const login = found.account?.login ?? '';
    return { login, type: found.account?.type === 'User' ? 'User' : 'Organization' };
  }

  /** Every installation of the App, each with the repositories it can see. */
  async installations(): Promise<GithubInstallationInfo[]> {
    const jwt = appJwt(this.credentials);
    const found = await this.collect<{ id: number; account?: { login?: string; type?: string } }>(
      `${BASE}/app/installations?per_page=100`,
      () => Promise.resolve(jwt),
    );
    return Promise.all(
      found.slice(0, MAX_INSTALLATIONS).map(async (installation) => {
        const id = String(installation.id);
        const api = new HttpGithubApi({ ...this.credentials, installationId: id }, this.send);
        return {
          id,
          account: {
            login: installation.account?.login ?? '',
            type:
              installation.account?.type === 'User' ? ('User' as const) : ('Organization' as const),
          },
          repositories: await api.repositories(),
        };
      }),
    );
  }

  /** Every repository the installation can see. */
  async repositories(): Promise<GithubRepositoryInfo[]> {
    const all = await this.list<{ full_name: string; private?: boolean }>(
      '/installation/repositories?per_page=100',
      'repositories',
    );
    return all
      .map((repository) => ({ name: repository.full_name, isPrivate: Boolean(repository.private) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get<T>(path: string): Promise<T> {
    return this.getWith<T>(path);
  }

  list<T>(path: string, key?: string): Promise<T[]> {
    return this.collect<T>(`${BASE}${path}`, () => this.installationToken(), key);
  }

  async status(path: string): Promise<number> {
    const response = await this.call(`${BASE}${path}`, await this.installationToken());
    if (response.status === 401) throw new GithubSignInError('GitHub refused the token');
    return response.status;
  }

  private async getWith<T>(path: string, authorization?: string): Promise<T> {
    const response = await this.call(
      `${BASE}${path}`,
      authorization ?? (await this.installationToken()),
    );
    return (await this.read(response)) as T;
  }

  private async collect<T>(
    first: string,
    authorize: () => Promise<string>,
    key?: string,
  ): Promise<T[]> {
    const items: T[] = [];
    let url: string | undefined = first;
    for (let page = 0; url && page < MAX_PAGES; page += 1) {
      const response = await this.call(url, await authorize());
      const body = await this.read(response);
      const rows = (key ? (body as Record<string, unknown>)[key] : body) as T[] | undefined;
      items.push(...(rows ?? []));
      url = nextPage(response.headers.get('link'));
    }
    return items;
  }

  private async read(response: Response): Promise<unknown> {
    if (response.status === 401) throw new GithubSignInError('GitHub refused the sign-in');
    if (response.status === 403 || response.status === 422) {
      throw new GithubAccessError(`Not allowed (${response.status})`);
    }
    if (response.status === 404) throw new GithubNotFoundError('Not found');
    if (!response.ok)
      throw new GithubRequestError(`GitHub answered ${response.status}`, response.status);
    return response.status === 204 ? undefined : response.json();
  }

  private async installationToken(): Promise<string> {
    if (this.token && this.token.expiresAt - TOKEN_MARGIN_MS > Date.now()) return this.token.value;
    const response = await this.call(
      `${BASE}/app/installations/${this.credentials.installationId}/access_tokens`,
      appJwt(this.credentials),
      'POST',
    );
    if (response.status === 401 || response.status === 404) {
      throw new GithubSignInError(`GitHub refused the App (${response.status})`);
    }
    const body = (await this.read(response)) as { token: string; expires_at: string };
    this.token = { value: body.token, expiresAt: Date.parse(body.expires_at) };
    return body.token;
  }

  private async call(
    url: string,
    bearer: string,
    method: 'GET' | 'POST' = 'GET',
  ): Promise<Response> {
    try {
      return await this.send(url, {
        method,
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${bearer}`,
          'user-agent': 'DPDP-Kit',
          'x-github-api-version': '2022-11-28',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new GithubRequestError('GitHub could not be reached');
    }
  }
}

/** Answers the same read once per run, however many checks ask, so a list is fetched one time. */
export function cachedGithub(api: GithubApi): GithubApi {
  const seen = new Map<string, Promise<unknown>>();
  const once = <T>(key: string, read: () => Promise<T>): Promise<T> => {
    if (!seen.has(key)) seen.set(key, read());
    return seen.get(key) as Promise<T>;
  };
  return {
    get: <T>(path: string) => once(`get:${path}`, () => api.get<T>(path)),
    list: <T>(path: string, key?: string) => once(`list:${path}`, () => api.list<T>(path, key)),
    status: (path: string) => once(`status:${path}`, () => api.status(path)),
  };
}

/** Makes the client for a set of credentials. Tests replace it with one that never leaves the machine. */
export abstract class GithubConnector {
  abstract connect(credentials: GithubCredentials): GithubApi;
  /** Signs in and reads; says which account the App is installed on. Throws `GithubSignInError` and the like when it does not work. */
  abstract verify(credentials: GithubCredentials): Promise<GithubAccount>;
  /** The installations of the App, with the repositories each can see. */
  abstract discover(app: GithubApp): Promise<GithubInstallationInfo[]>;
  /** The repositories one installation can see. */
  abstract repositories(credentials: GithubCredentials): Promise<GithubRepositoryInfo[]>;
}

export class HttpGithubConnector extends GithubConnector {
  connect(credentials: GithubCredentials): GithubApi {
    return new HttpGithubApi(credentials);
  }

  verify(credentials: GithubCredentials): Promise<GithubAccount> {
    return new HttpGithubApi(credentials).verify();
  }

  discover(app: GithubApp): Promise<GithubInstallationInfo[]> {
    return new HttpGithubApi({ ...app, installationId: '' }).installations();
  }

  repositories(credentials: GithubCredentials): Promise<GithubRepositoryInfo[]> {
    return new HttpGithubApi(credentials).repositories();
  }
}
