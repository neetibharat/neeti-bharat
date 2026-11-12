import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';
import { AesSecretBox, DisabledSecretBox, SecretBox } from './secret-box';

/** The only place that decides whether secrets can be kept: they can when `SECRETS_ENCRYPTION_KEY` is set. */
export function createSecretBox(config: ConfigService<Env, true>): SecretBox {
  const key = config.get('SECRETS_ENCRYPTION_KEY', { infer: true });
  return key ? new AesSecretBox(key) : new DisabledSecretBox();
}

@Module({
  providers: [{ provide: SecretBox, inject: [ConfigService], useFactory: createSecretBox }],
  exports: [SecretBox],
})
export class SecretsModule {}
