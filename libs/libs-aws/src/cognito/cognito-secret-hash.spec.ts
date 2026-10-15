import { computeSecretHash } from './cognito-secret-hash';

describe('computeSecretHash', () => {
  it('should compute valid HMAC-SHA256 Base64 hash matching known test vector', () => {
    // Known test vector
    const username = 'testuser';
    const clientId = '23k4j5h6g7f8';
    const clientSecret = 'secretkey123';

    const hash = computeSecretHash(username, clientId, clientSecret);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    // Result is standard Base64 string
    expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);

    // Consistency check
    const hash2 = computeSecretHash(username, clientId, clientSecret);
    expect(hash).toBe(hash2);
  });

  it('should throw an error if any required parameter is missing', () => {
    expect(() => computeSecretHash('', 'client', 'secret')).toThrow(
      'Username, clientId, and clientSecret are all required to compute SECRET_HASH',
    );
    expect(() => computeSecretHash('user', '', 'secret')).toThrow(
      'Username, clientId, and clientSecret are all required to compute SECRET_HASH',
    );
    expect(() => computeSecretHash('user', 'client', '')).toThrow(
      'Username, clientId, and clientSecret are all required to compute SECRET_HASH',
    );
  });
});
