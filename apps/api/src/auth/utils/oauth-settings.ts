import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.validation';
import type { AuthSettings } from '../auth.factory';

type OAuthSettings = Pick<AuthSettings, 'google' | 'microsoft'>;

/** Google and Microsoft are on only when their id and secret are both set (env validation enforces the pair). */
export function readOAuthSettings(config: ConfigService<Env, true>): OAuthSettings {
  const get = <K extends keyof Env>(key: K) => config.get(key, { infer: true });
  const google = get('GOOGLE_CLIENT_ID') && get('GOOGLE_CLIENT_SECRET');
  const microsoft = get('MICROSOFT_CLIENT_ID') && get('MICROSOFT_CLIENT_SECRET');

  return {
    google: google
      ? { clientId: get('GOOGLE_CLIENT_ID')!, clientSecret: get('GOOGLE_CLIENT_SECRET')! }
      : undefined,
    microsoft: microsoft
      ? {
          clientId: get('MICROSOFT_CLIENT_ID')!,
          clientSecret: get('MICROSOFT_CLIENT_SECRET')!,
          tenantId: get('MICROSOFT_TENANT_ID'),
        }
      : undefined,
  };
}
