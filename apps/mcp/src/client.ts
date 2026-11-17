import type { Config } from './config.js';

/** An answer from the API that was not a success. The API sends a status and a `code`, never prose. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`${status} ${code}`);
  }
}

export type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
}

/** The only thing that talks to the API. It sends the key in a header and nowhere else. */
export class Api {
  constructor(
    private readonly config: Config,
    private readonly send: typeof fetch = fetch,
  ) {}

  get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path, {});
  }

  /** A file goes up as a form; the browser-style form sets its own content type. */
  upload<T>(path: string, form: FormData): Promise<T> {
    return this.request<T>('POST', path, { body: form });
  }

  private async request<T>(method: string, path: string, options: RequestOptions): Promise<T> {
    const { body } = options;
    const isForm = body instanceof FormData;
    const response = await this.send(this.address(path, options.query), {
      method,
      headers: {
        'x-api-key': this.config.apiKey,
        ...(body !== undefined && !isForm && { 'content-type': 'application/json' }),
      },
      body: body === undefined || isForm ? (body as FormData | undefined) : JSON.stringify(body),
    });
    if (!response.ok) throw new ApiError(response.status, await codeOf(response));
    return (response.status === 204 ? undefined : await response.json()) as T;
  }

  private address(path: string, query: Query = {}): string {
    const url = new URL(`${this.config.apiUrl}/v1${path}`);
    for (const [name, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(name, String(value));
    }
    return url.toString();
  }
}

async function codeOf(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { code?: unknown };
    return typeof body.code === 'string' ? body.code : 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}
