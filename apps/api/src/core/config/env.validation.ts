import {
  AI_DEFAULT_MODELS,
  AI_KEY_MAX_LENGTH,
  AI_MODEL_MAX_LENGTH,
  AI_PROVIDERS,
} from '@neeti-bharat/shared';
import { z } from 'zod';
import { isValidSecretKey } from '../secrets/secret-box';

/** A blank line in .env means "not set". */
const optionalText = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const smtpFields = {
  SMTP_HOST: optionalText,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalText,
  SMTP_PASSWORD: optionalText,
  SMTP_FROM: optionalText,
};

const oauthFields = {
  GOOGLE_CLIENT_ID: optionalText,
  GOOGLE_CLIENT_SECRET: optionalText,
  MICROSOFT_CLIENT_ID: optionalText,
  MICROSOFT_CLIENT_SECRET: optionalText,
  MICROSOFT_TENANT_ID: z.string().min(1).default('common'),
};

const storageFields = {
  STORAGE_BUCKET: optionalText,
  STORAGE_REGION: z.string().min(1).default('us-east-1'),
  STORAGE_ENDPOINT: z.preprocess((v) => (v === '' ? undefined : v), z.url().optional()),
  STORAGE_ACCESS_KEY_ID: optionalText,
  STORAGE_SECRET_ACCESS_KEY: optionalText,
  // Azure Blob Storage, instead of the S3 settings above. The three are set together.
  AZURE_STORAGE_ACCOUNT: optionalText,
  AZURE_STORAGE_KEY: optionalText,
  AZURE_STORAGE_CONTAINER: optionalText,
  AZURE_STORAGE_ENDPOINT: z.preprocess((v) => (v === '' ? undefined : v), z.url().optional()),
  STORAGE_FORCE_PATH_STYLE: z
    .preprocess((v) => (v === '' ? undefined : v), z.stringbool())
    .default(false),
};

/** The key that seals secrets the app must read back, such as the credentials of a connection. */
const secretsFields = {
  SECRETS_ENCRYPTION_KEY: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z
      .string()
      .refine(isValidSecretKey, 'Use 32 random bytes in base64: openssl rand -base64 32')
      .optional(),
  ),
};

/** The one AI service the install uses. Leave the key empty and AI help is off. */
const aiFields = {
  AI_PROVIDER: z.preprocess((v) => (v === '' ? undefined : v), z.enum(AI_PROVIDERS).optional()),
  // A model name is letters, digits and a few separators, never anything that could change an address.
  AI_MODEL: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z
      .string()
      .max(AI_MODEL_MAX_LENGTH)
      .regex(/^[\w.:-]+$/)
      .optional(),
  ),
  AI_API_KEY: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().max(AI_KEY_MAX_LENGTH).regex(/^\S+$/).optional(),
  ),
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.url(),
    API_PORT: z.coerce.number().int().positive().default(3201),
    WEB_ORIGIN: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    INITIAL_ADMIN_EMAIL: z.preprocess((v) => (v === '' ? undefined : v), z.email().optional()),
    ...smtpFields,
    ...oauthFields,
    ...storageFields,
    ...secretsFields,
    ...aiFields,
  })
  .refine((env) => env.NODE_ENV !== 'production' || Boolean(env.SMTP_HOST), {
    message: 'SMTP_HOST is required in production, so sign-in links can be emailed',
    path: ['SMTP_HOST'],
  })
  .refine((env) => env.NODE_ENV !== 'production' || Boolean(env.INITIAL_ADMIN_EMAIL), {
    message:
      'INITIAL_ADMIN_EMAIL is required in production, so only that person can claim a new install',
    path: ['INITIAL_ADMIN_EMAIL'],
  })
  .refine((env) => Boolean(env.GOOGLE_CLIENT_ID) === Boolean(env.GOOGLE_CLIENT_SECRET), {
    message: 'Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither',
    path: ['GOOGLE_CLIENT_ID'],
  })
  .refine((env) => Boolean(env.MICROSOFT_CLIENT_ID) === Boolean(env.MICROSOFT_CLIENT_SECRET), {
    message: 'Set both MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET, or neither',
    path: ['MICROSOFT_CLIENT_ID'],
  })
  .refine((env) => Boolean(env.STORAGE_ACCESS_KEY_ID) === Boolean(env.STORAGE_SECRET_ACCESS_KEY), {
    message:
      'Set both STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY, or neither to use the default AWS credentials',
    path: ['STORAGE_ACCESS_KEY_ID'],
  })
  .refine(
    (env) => {
      const set = [
        env.AZURE_STORAGE_ACCOUNT,
        env.AZURE_STORAGE_KEY,
        env.AZURE_STORAGE_CONTAINER,
      ].filter(Boolean).length;
      return set === 0 || set === 3;
    },
    {
      message:
        'Set AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY and AZURE_STORAGE_CONTAINER together, or none of them',
      path: ['AZURE_STORAGE_ACCOUNT'],
    },
  )
  .refine((env) => !(env.AZURE_STORAGE_ACCOUNT && env.STORAGE_BUCKET), {
    message: 'Use either Azure Blob Storage (AZURE_STORAGE_*) or S3 (STORAGE_BUCKET), not both',
    path: ['AZURE_STORAGE_ACCOUNT'],
  })
  .refine((env) => Boolean(env.AI_API_KEY) === Boolean(env.AI_PROVIDER), {
    message: 'Set both AI_PROVIDER and AI_API_KEY, or neither',
    path: ['AI_PROVIDER'],
  })
  .refine(
    (env) => !env.AI_PROVIDER || Boolean(env.AI_MODEL ?? AI_DEFAULT_MODELS[env.AI_PROVIDER]),
    {
      message:
        'AI_MODEL is required for this AI_PROVIDER: name the model, as the service writes it',
      path: ['AI_MODEL'],
    },
  )
  .refine((env) => !env.SMTP_HOST || Boolean(env.SMTP_FROM), {
    message: 'SMTP_FROM is required when SMTP_HOST is set',
    path: ['SMTP_FROM'],
  });

export type Env = z.infer<typeof envSchema>;

/** Runs once at boot; the app refuses to start on a bad environment. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
