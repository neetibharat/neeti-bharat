import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Interactive API docs at /docs. Off in production. */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Neeti Bharat API')
    .setDescription(
      'Sign-in itself is under /api/auth (Better Auth). Everything else is under /v1. A script or agent can send an API key in the x-api-key header instead of signing in.',
    )
    .setVersion('0.1.0')
    .addCookieAuth('better-auth.session_token')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
