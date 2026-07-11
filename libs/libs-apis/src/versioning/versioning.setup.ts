import { INestApplication, VersioningType } from '@nestjs/common';
import { VersioningSetupOptions } from './interfaces';

/**
 * Reusable utility to configure API versioning on a NestJS application.
 * Forces the use of Media Type versioning strategy (key: "v") as per requirements.
 *
 * @param app The NestJS application instance.
 * @param options Configurations for versioning setup.
 */
export function setupVersioning(app: INestApplication, options: VersioningSetupOptions = {}): void {
  app.enableVersioning({
    type: VersioningType.MEDIA_TYPE,
    key: 'v',
    defaultVersion: options.defaultVersion,
  });
}
