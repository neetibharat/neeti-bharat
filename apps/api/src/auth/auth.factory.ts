import { Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins';
import type { MailService } from '../core/mail/mail.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { AccessPolicyService } from './services/access-policy.service';
import { MAGIC_LINK_MINUTES, signInEmail } from './utils/sign-in-email';

const logger = new Logger('SignIn');

export interface OAuthClient {
  clientId: string;
  clientSecret: string;
}

export interface AuthSettings {
  /** The address people use in the browser: sign-in links are built from it, and the web app proxies /api to us. */
  baseURL: string;
  secret: string;
  webOrigin: string;
  google?: OAuthClient;
  microsoft?: OAuthClient & { tenantId: string };
}

export interface AuthDeps {
  settings: AuthSettings;
  prisma: PrismaService;
  mail: MailService;
  access: AccessPolicyService;
}

const OPEN_TENANTS = ['common', 'organizations', 'consumers'];

/**
 * Google verifies emails. Microsoft does only inside one tenant: on an open tenant anyone can set any
 * email on their account, so linking by email there would let them take over someone else's.
 */
function linkableProviders({ microsoft }: AuthSettings): string[] {
  const microsoftIsOneTenant = microsoft && !OPEN_TENANTS.includes(microsoft.tenantId);
  return ['google', ...(microsoftIsOneTenant ? ['microsoft'] : [])];
}

/** Only the first person and invited people may get a new account, whichever way they sign in. */
function newUserHooks(access: AccessPolicyService) {
  return {
    before: async (user: { email: string }) => {
      const decision = await access.decide(user.email);
      if (!decision.allowed) {
        throw new APIError('FORBIDDEN', {
          message: 'INVITATION_REQUIRED',
          code: 'INVITATION_REQUIRED',
        });
      }
      return { data: { ...user, role: decision.role } };
    },
    after: (user: { id: string; email: string; name?: string; role?: unknown }) =>
      access.onUserCreated({
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        role: String(user.role ?? 'member'),
      }),
  };
}

/** Someone who has left cannot start a session, whether they use the email link, Google or Microsoft. */
function blockDisabled(access: AccessPolicyService) {
  return {
    before: async (session: { userId: string }) => {
      if (await access.isDisabled(session.userId)) {
        throw new APIError('FORBIDDEN', { message: 'FORBIDDEN', code: 'FORBIDDEN' });
      }
    },
  };
}

/** The one Better Auth instance. Its Prisma adapter is the only database access outside a repository. */
export function createAuth({ settings, prisma, mail, access }: AuthDeps) {
  return betterAuth({
    baseURL: settings.baseURL,
    secret: settings.secret,
    trustedOrigins: [settings.webOrigin],
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    socialProviders: {
      ...(settings.google && { google: settings.google }),
      ...(settings.microsoft && { microsoft: settings.microsoft }),
    },
    // Same email, different method: one person, one account.
    account: { accountLinking: { enabled: true, trustedProviders: linkableProviders(settings) } },
    user: {
      additionalFields: { role: { type: 'string', defaultValue: 'member', input: false } },
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_MINUTES * 60,
        sendMagicLink: async ({ email, url }) => {
          // Not invited: send nothing, so the response never reveals who has access. The mail is not awaited, so an
          // invited address does not answer more slowly than one that is not.
          if ((await access.decide(email)).allowed) {
            void mail
              .send(signInEmail(email, url))
              .catch((error: unknown) => logger.error(`Sign-in email failed: ${String(error)}`));
          }
        },
      }),
    ],
    databaseHooks: {
      user: { create: newUserHooks(access) },
      session: { create: blockDisabled(access) },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
