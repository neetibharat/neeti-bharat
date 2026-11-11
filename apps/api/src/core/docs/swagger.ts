import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Interactive API docs at /docs. Off in production. */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('DPDP Kit API')
    .setDescription(
      'Sign-in itself is under /api/auth (Better Auth). Everything else is under /v1.',
    )
    .setVersion('0.1.0')
    .addCookieAuth('better-auth.session_token')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
