import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { API_KEY_HEADER, ORGANIZATION_HEADER } from '@dpdp-kit/shared';
import type { AddressInfo } from 'node:net';
import { AiClient } from '../../src/ai/providers/ai-client';
import { AzureConnector } from '../../src/connections/providers/azure/azure-api';
import { GithubConnector } from '../../src/connections/providers/github/github-api';
import { MailService, type MailMessage } from '../../src/core/mail/mail.service';
import { tmpdir } from 'node:os';
import { PrismaService } from '../../src/core/prisma/prisma.service';
import { ConnectionScheduleService } from '../../src/connections/services/connection-schedule.service';
import { ProofReportService } from '../../src/proof-reports/services/proof-report.service';
import { NotificationScanner } from '../../src/notifications/services/notification-scanner';
import { fakeAi } from './fake-ai-client';
import { azureConnector } from './fake-azure-connector';
import { githubConnector } from './fake-github-connector';
import { createTestDatabase, type TestDatabase } from './test-database';

const WEB_ORIGIN = 'http://localhost:3200';

/** What the app reads from its environment. Anything that would reach a real service is switched off. */
function useTestEnvironment(databaseUrl: string): void {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    WEB_ORIGIN,
    BETTER_AUTH_SECRET: 'end-to-end-secret-end-to-end-secret',
    API_PORT: '3299',
    // Whoever claims the install. Set outright, because an empty value would let the developer's own .env decide.
    INITIAL_ADMIN_EMAIL: 'alice@alpha.test',
    SMTP_HOST: '',
    SMTP_FROM: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    MICROSOFT_CLIENT_ID: '',
    MICROSOFT_CLIENT_SECRET: '',
    STORAGE_BUCKET: '',
    STORAGE_ENDPOINT: '',
    STORAGE_ACCESS_KEY_ID: '',
    STORAGE_SECRET_ACCESS_KEY: '',
    // A fixed key for the run, so connections can keep credentials.
    SECRETS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
    AZURE_STORAGE_ACCOUNT: '',
    AZURE_STORAGE_KEY: '',
    AZURE_STORAGE_CONTAINER: '',
    AZURE_STORAGE_ENDPOINT: '',
  });
}

export interface Reply<T = unknown> {
  status: number;
  body: T;
  text: string;
}

/** One signed-in person calling the API, in an organisation of their choosing. */
export class Client {
  constructor(
    private readonly base: string,
    private readonly cookie: string,
    private readonly apiKey = '',
  ) {}

  /** The headers and body of a call: JSON for most, and the form as it is when a file goes up. */
  private requestInit(method: string, options: { organization?: string; body?: unknown }) {
    const headers: Record<string, string> = { origin: WEB_ORIGIN };
    if (this.cookie) headers.cookie = this.cookie;
    if (this.apiKey) headers[API_KEY_HEADER] = this.apiKey;
    if (options.organization) headers[ORGANIZATION_HEADER] = options.organization;
    const { body } = options;
    if (body === undefined || body instanceof FormData) {
      return { method, headers, body: body as FormData | undefined };
    }
    headers['content-type'] = 'application/json';
    return { method, headers, body: JSON.stringify(body) };
  }

  async call<T = unknown>(
    method: string,
    path: string,
    options: { organization?: string; body?: unknown } = {},
  ): Promise<Reply<T>> {
    const response = await fetch(`${this.base}${path}`, this.requestInit(method, options));
    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // Not JSON: a CSV or a zip. The text is kept.
    }
    return { status: response.status, body: body as T, text };
  }

  get = <T = unknown>(path: string, organization?: string) =>
    this.call<T>('GET', path, { organization });
  post = <T = unknown>(path: string, body?: unknown, organization?: string) =>
    this.call<T>('POST', path, { organization, body });
  put = <T = unknown>(path: string, body: unknown, organization?: string) =>
    this.call<T>('PUT', path, { organization, body });
  /** Sends a file as a form, the way a browser does. */
  upload = <T = unknown>(path: string, form: FormData, organization?: string) =>
    this.call<T>('POST', path, { organization, body: form });
  delete = <T = unknown>(path: string, organization?: string) =>
    this.call<T>('DELETE', path, { organization });
}

export interface TestApp {
  /** Signs a person in the way they would: asks for the email link and follows it. */
  signIn: (email: string) => Promise<Client>;
  /** Someone who has not signed in. */
  anonymous: Client;
  /** A script or agent calling with an API key and nothing else. */
  withKey: (key: string) => Client;
  /** Makes the day's notices now, as the daily check would, as of `now`. */
  scanNotices: (now?: Date) => Promise<void>;
  /** Checks the connections that are due, as the hourly look would, as of `now`. */
  runScheduledChecks: (now?: Date) => Promise<void>;
  /** Keeps the reports that have something new to say on their proofs, as the hourly look would. */
  refreshProofReports: (now?: Date) => Promise<void>;
  /** Every email the app has sent, oldest first. */
  mailSent: () => MailMessage[];
  /** Every path of the API that is a GET and takes no parameters, for sweeping. */
  readRoutes: () => string[];
  stop: () => Promise<void>;
}

/**
 * Builds the real app. The app reads `.env` files by relative path when its module is first loaded, which would let a
 * developer's own settings, and their own database, take over from the ones made for the test. So it is loaded from
 * a directory where no such file exists.
 */
async function compileApp(inbox: MailMessage[]) {
  const here = process.cwd();
  process.chdir(tmpdir());
  try {
    const { AppModule } = await import('../../src/app.module.js');
    return await Test.createTestingModule({ imports: [AppModule] })
      // Microsoft is replaced by a fake that answers from a table, so no test leaves the machine.
      .overrideProvider(AzureConnector)
      .useValue(azureConnector)
      .overrideProvider(GithubConnector)
      .useValue(githubConnector)
      // The AI services are replaced by a fake that answers from a table, so no test leaves the machine.
      .overrideProvider(AiClient)
      .useValue(fakeAi)
      .overrideProvider(MailService)
      .useValue({
        send: (message: MailMessage) => {
          inbox.push(message);
          return Promise.resolve();
        },
      })
      .compile();
  } finally {
    process.chdir(here);
  }
}

/** Refuses to go on if the app is not talking to the database made for the run, before anything is written. */
async function assertUsesTestDatabase(prisma: PrismaService, url: string): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<{ db: string }[]>('select current_database() as db');
  const db = rows[0]?.db;
  if (db !== new URL(url).pathname.slice(1)) {
    throw new Error(`The app is using the database "${db}" instead of the one made for the test`);
  }
}

/** Waits for the email link to arrive: it is sent without the request waiting for it. */
async function waitForLink(inbox: MailMessage[], email: string): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const message = [...inbox].reverse().find((mail) => mail.to === email);
    const link = /https?:\/\/\S+\/magic-link\/verify\?\S+/.exec(message?.text ?? '')?.[0];
    if (link) return link;
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`No sign-in link was sent to ${email}`);
}

/** Signs a person in the way they would: asks for the email link and follows it. */
async function signInAs(base: string, inbox: MailMessage[], email: string): Promise<Client> {
  const asked = await fetch(`${base}/api/auth/sign-in/magic-link`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email }),
  });
  if (!asked.ok) {
    throw new Error(`Asking for a sign-in link failed with ${asked.status}: ${await asked.text()}`);
  }
  const link = await waitForLink(inbox, email);
  const followed = await fetch(link.replace(WEB_ORIGIN, base), {
    headers: { origin: WEB_ORIGIN },
    redirect: 'manual',
  });
  const cookie = followed.headers
    .getSetCookie()
    .map((entry) => entry.split(';')[0])
    .join('; ');
  if (!cookie) throw new Error(`Signing in as ${email} gave no session`);
  return new Client(base, cookie);
}

/** Every path of the API that is a GET and takes no parameters. */
function readRoutesOf(app: INestApplication): string[] {
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
  return Object.entries(document.paths)
    .filter(([path, item]) => 'get' in item && !path.includes('{'))
    .map(([path]) => path);
}

/** Starts the real API on a database of its own, with the email replaced by one that keeps what it is asked to send. */
export async function startTestApp(): Promise<TestApp> {
  const database: TestDatabase = await createTestDatabase();
  useTestEnvironment(database.url);
  const inbox: MailMessage[] = [];
  let moduleRef: Awaited<ReturnType<typeof compileApp>>;
  try {
    moduleRef = await compileApp(inbox);
    await assertUsesTestDatabase(moduleRef.get(PrismaService), database.url);
  } catch (error) {
    // Nothing is running yet that would remove the database, so it goes now.
    await database.drop();
    throw error;
  }
  const app: INestApplication = moduleRef.createNestApplication({
    bodyParser: false,
    logger: ['error', 'warn'],
  });
  app.setGlobalPrefix('v1');
  await app.listen(0);
  const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;

  return {
    signIn: (email) => signInAs(base, inbox, email),
    anonymous: new Client(base, ''),
    withKey: (key) => new Client(base, '', key),
    scanNotices: (now = new Date()) => moduleRef.get(NotificationScanner).scanAll(now),
    runScheduledChecks: (now = new Date()) =>
      moduleRef.get(ConnectionScheduleService).runAllDue(now),
    refreshProofReports: (now = new Date()) => moduleRef.get(ProofReportService).refreshAll(now),
    mailSent: () => inbox,
    readRoutes: () => readRoutesOf(app),
    stop: async () => {
      await app.close();
      await database.drop();
    },
  };
}
