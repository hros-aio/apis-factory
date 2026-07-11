import { createCorsOptions } from '../src/cors/cors.config';

describe('CORS Configuration Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should default to secure defaults (restricted CORS) if env is empty', () => {
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_CREDENTIALS;

    const options = createCorsOptions();
    expect(options.origin).toBe(false);
    expect(options.credentials).toBe(false);
  });

  it('should parse multiple origins from CORS_ALLOWED_ORIGINS env variable', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://example.com,https://api.example.com';
    process.env.CORS_CREDENTIALS = 'true';

    const options = createCorsOptions();
    expect(options.origin).toEqual([
      'https://example.com',
      'https://api.example.com',
    ]);
    expect(options.credentials).toBe(true);
  });

  it('should allow custom overrides to take precedence over env configuration', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://example.com';
    process.env.CORS_CREDENTIALS = 'true';

    const options = createCorsOptions({
      origin: 'https://override.com',
      credentials: false,
      methods: 'GET,POST',
    });

    expect(options.origin).toBe('https://override.com');
    expect(options.credentials).toBe(false);
    expect(options.methods).toBe('GET,POST');
  });

  it('should support preflight configuration and exposed headers', () => {
    const options = createCorsOptions({
      exposedHeaders: ['X-Total-Count'],
      preflightContinue: false,
    });
    expect(options.exposedHeaders).toEqual(['X-Total-Count']);
    expect(options.preflightContinue).toBe(false);
  });
});
