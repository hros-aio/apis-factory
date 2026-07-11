import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerSetupOptions } from './interfaces';

/**
 * Reusable utility to set up Swagger documentation on a NestJS application.
 *
 * Configurable via parameter options and process environment variables:
 * - SWAGGER_ENABLED: Set to "true" to enable. Disabled by default if omitted.
 * - SWAGGER_PATH: Custom path to mount the Swagger UI (defaults to "docs").
 *
 * Supports JWT Bearer Authentication out of the box.
 *
 * @param app The NestJS application instance.
 * @param options Configurations for the Swagger document.
 */
export function setupSwagger(app: INestApplication, options: SwaggerSetupOptions = {}): void {
  const isEnabled =
    options.enabled !== undefined
      ? options.enabled
      : process.env.SWAGGER_ENABLED === 'true';

  if (!isEnabled) {
    return;
  }

  const builder = new DocumentBuilder()
    .setTitle(options.title || 'API Documentation')
    .setDescription(options.description || 'API Platform Services')
    .setVersion(options.version || '1.0.0');

  if (options.serverUrl) {
    builder.addServer(options.serverUrl);
  }

  if (options.bearerAuth) {
    builder.addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'bearer',
    );
  }

  if (options.tags) {
    options.tags.forEach((tag) => builder.addTag(tag));
  }

  if (options.externalDocTitle && options.externalDocUrl) {
    builder.setExternalDoc(options.externalDocTitle, options.externalDocUrl);
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config);

  const mountPath = options.path || process.env.SWAGGER_PATH || 'docs';
  SwaggerModule.setup(mountPath, app, document);
}
