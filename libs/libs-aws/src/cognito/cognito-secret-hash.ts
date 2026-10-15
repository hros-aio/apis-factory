import { createHmac } from 'crypto';

/**
 * Computes the AWS Cognito App Client SECRET_HASH using HMAC-SHA256.
 *
 * Formula: Base64(HMAC-SHA256(clientSecret, username + clientId))
 *
 * @param username The username or email of the user
 * @param clientId The Cognito App Client ID
 * @param clientSecret The Cognito App Client Secret
 * @returns The Base64-encoded secret hash string
 */
export function computeSecretHash(
  username: string,
  clientId: string,
  clientSecret: string,
): string {
  if (!username || !clientId || !clientSecret) {
    throw new Error('Username, clientId, and clientSecret are all required to compute SECRET_HASH');
  }

  return createHmac('sha256', clientSecret)
    .update(`${username}${clientId}`)
    .digest('base64');
}
