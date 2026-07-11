import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Generates CORS options for NestJS applications based on environment variables and custom overrides.
 *
 * Environment variables:
 * - CORS_ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g. "https://example.com,https://api.example.com").
 * - CORS_CREDENTIALS: Set to "true" to enable credentials support.
 *
 * Defaults to secure behavior (origin: false, credentials: false) if environment variables are not set.
 *
 * @param overrides Optional partial CorsOptions to override generated defaults.
 * @returns Standard NestJS CorsOptions.
 */
export function createCorsOptions(overrides?: Partial<CorsOptions>): CorsOptions {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
  const envCredentials = process.env.CORS_CREDENTIALS;

  let origin: CorsOptions['origin'] = false;

  if (envOrigins) {
    const parsedOrigins = envOrigins
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (parsedOrigins.length > 0) {
      origin = parsedOrigins.length === 1 ? parsedOrigins[0] : parsedOrigins;
    }
  }

  const credentials = envCredentials === 'true';

  const defaultOptions: CorsOptions = {
    origin,
    credentials,
  };

  return {
    ...defaultOptions,
    ...overrides,
  };
}
