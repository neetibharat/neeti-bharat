import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { Env } from './core/config/env.validation';
import { setupSwagger } from './core/docs/swagger';

// Better Auth reads the raw body itself, so Nest's parser is off; the auth module adds parsers back for other routes.
function isProduction(config: ConfigService<Env, true>): boolean {
  return config.get('NODE_ENV', { infer: true }) === 'production';
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.use(helmet({ contentSecurityPolicy: isProduction(config) ? undefined : false }));
  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }), credentials: true });
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  if (!isProduction(config)) setupSwagger(app);

  await app.listen(config.get('API_PORT', { infer: true }));
}

void bootstrap();
