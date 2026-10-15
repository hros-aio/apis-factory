import { Injectable, Inject } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  SignUpCommandOutput,
  ConfirmSignUpCommand,
  ConfirmSignUpCommandOutput,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ForgotPasswordCommandOutput,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordCommandOutput,
  ChangePasswordCommand,
  ChangePasswordCommandOutput,
  GlobalSignOutCommand,
  GlobalSignOutCommandOutput,
  GetTokensFromRefreshTokenCommand,
  AttributeType,
  ChallengeNameType,
} from '@aws-sdk/client-cognito-identity-provider';
import { COGNITO_CLIENT } from './cognito.constants';
import { COGNITO_MODULE_OPTIONS_TOKEN } from './cognito.module-definition';
import {
  CognitoModuleOptions,
  CognitoAuthResult,
  CognitoTokens,
  SignUpInput,
  ConfirmSignUpInput,
  SignInInput,
  RefreshTokenInput,
  RespondToChallengeInput,
  ForgotPasswordInput,
  ConfirmForgotPasswordInput,
  ChangePasswordInput,
} from './cognito.types';
import { computeSecretHash } from './cognito-secret-hash';
import { CognitoErrorMapper, CognitoInternalException } from './cognito.errors';

function normalizeAttributes(
  attributes?: AttributeType[] | Record<string, string>,
): AttributeType[] | undefined {
  if (!attributes) return undefined;
  if (Array.isArray(attributes)) return attributes;
  return Object.entries(attributes).map(([Name, Value]) => ({ Name, Value }));
}

/**
 * Service for end-user authentication and token lifecycle via Cognito App Clients.
 * Automatically computes SECRET_HASH for secret-bearing clients and preserves auth challenges.
 */
@Injectable()
export class CognitoAuthService {
  constructor(
    @Inject(COGNITO_MODULE_OPTIONS_TOKEN) private readonly options: CognitoModuleOptions,
    @Inject(COGNITO_CLIENT) private readonly client: CognitoIdentityProviderClient,
  ) {
    if (!this.options?.clientId) {
      // Note: Warning or deferred validation; clientId is essential for auth flows
    }
  }

  private getClientId(): string {
    if (!this.options.clientId) {
      throw new CognitoInternalException('clientId must be configured in CognitoModuleOptions to use CognitoAuthService');
    }
    return this.options.clientId;
  }

  private getSecretHash(username: string): string | undefined {
    if (this.options.clientSecret) {
      return computeSecretHash(username, this.getClientId(), this.options.clientSecret);
    }
    return undefined;
  }

  /**
   * Registers a new user via the public Cognito App Client.
   */
  async signUp(input: SignUpInput): Promise<SignUpCommandOutput> {
    try {
      const clientId = this.getClientId();
      const secretHash = this.getSecretHash(input.username);

      const command = new SignUpCommand({
        ClientId: clientId,
        SecretHash: secretHash,
        Username: input.username,
        Password: input.password,
        UserAttributes: normalizeAttributes(input.userAttributes),
        ValidationData: input.validationData,
        ClientMetadata: input.clientMetadata,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to sign up user '${input.username}'`);
    }
  }

  /**
   * Confirms user registration with the verification code sent to the user.
   */
  async confirmSignUp(input: ConfirmSignUpInput): Promise<ConfirmSignUpCommandOutput> {
    try {
      const clientId = this.getClientId();
      const secretHash = this.getSecretHash(input.username);

      const command = new ConfirmSignUpCommand({
        ClientId: clientId,
        SecretHash: secretHash,
        Username: input.username,
        ConfirmationCode: input.confirmationCode,
        ForceAliasCreation: input.forceAliasCreation,
        ClientMetadata: input.clientMetadata,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to confirm sign up for user '${input.username}'`);
    }
  }

  /**
   * Initiates authentication using USER_PASSWORD_AUTH flow.
   * Returns either tokens or an interactive authentication challenge.
   */
  async signIn(input: SignInInput): Promise<CognitoAuthResult> {
    try {
      const clientId = this.getClientId();
      const authParameters: Record<string, string> = {
        USERNAME: input.username,
        PASSWORD: input.password,
      };

      const secretHash = this.getSecretHash(input.username);
      if (secretHash) {
        authParameters.SECRET_HASH = secretHash;
      }

      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: authParameters,
        ClientMetadata: input.clientMetadata,
      });

      const response = await this.client.send(command);

      if (response.AuthenticationResult) {
        const tokens: CognitoTokens = {
          accessToken: response.AuthenticationResult.AccessToken || '',
          idToken: response.AuthenticationResult.IdToken || '',
          refreshToken: response.AuthenticationResult.RefreshToken,
          expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
          tokenType: response.AuthenticationResult.TokenType || 'Bearer',
        };
        return { isChallenge: false, tokens };
      }

      if (response.ChallengeName) {
        return {
          isChallenge: true,
          challenge: {
            challengeName: response.ChallengeName,
            session: response.Session || '',
            challengeParameters: response.ChallengeParameters || {},
          },
        };
      }

      throw new CognitoInternalException('InitiateAuth returned neither tokens nor challenge');
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Authentication failed for user '${input.username}'`);
    }
  }

  /**
   * Refreshes access and ID tokens using a refresh token.
   * Supports both rotating clients (using GetTokensFromRefreshTokenCommand) and
   * non-rotating clients (retaining InitiateAuthCommand REFRESH_TOKEN_AUTH).
   * When clientSecret is configured without a username, delegates to GetTokensFromRefreshTokenCommand
   * which accepts the client secret directly.
   */
  async refreshToken(input: RefreshTokenInput): Promise<CognitoTokens> {
    try {
      const clientId = this.getClientId();
      const isRotation = input.refreshTokenRotation ?? this.options.refreshTokenRotation ?? false;

      // Rotating clients, or when clientSecret is configured without an explicit username
      // (GetTokensFromRefreshTokenCommand accepts clientSecret directly without requiring SECRET_HASH)
      if (isRotation || (this.options.clientSecret && !input.username)) {
        const command = new GetTokensFromRefreshTokenCommand({
          ClientId: clientId,
          RefreshToken: input.refreshToken,
          ClientSecret: this.options.clientSecret,
          ClientMetadata: input.clientMetadata,
        });

        const response = await this.client.send(command);

        if (!response.AuthenticationResult) {
          throw new CognitoInternalException('RefreshToken flow did not return authentication tokens');
        }

        return {
          accessToken: response.AuthenticationResult.AccessToken || '',
          idToken: response.AuthenticationResult.IdToken || '',
          refreshToken: response.AuthenticationResult.RefreshToken || input.refreshToken,
          expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
          tokenType: response.AuthenticationResult.TokenType || 'Bearer',
        };
      }

      // Non-rotating clients retain InitiateAuthCommand with REFRESH_TOKEN_AUTH
      const authParameters: Record<string, string> = {
        REFRESH_TOKEN: input.refreshToken,
      };

      if (input.username && this.options.clientSecret) {
        authParameters.SECRET_HASH = this.getSecretHash(input.username)!;
      }

      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: clientId,
        AuthParameters: authParameters,
        ClientMetadata: input.clientMetadata,
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new CognitoInternalException('RefreshToken flow did not return authentication tokens');
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken || '',
        idToken: response.AuthenticationResult.IdToken || '',
        refreshToken: response.AuthenticationResult.RefreshToken || input.refreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
        tokenType: response.AuthenticationResult.TokenType || 'Bearer',
      };
    } catch (error) {
      throw CognitoErrorMapper.map(error, 'Token refresh failed');
    }
  }

  /**
   * Responds to an authentication challenge (e.g., NEW_PASSWORD_REQUIRED, SMS_MFA).
   */
  async respondToChallenge(input: RespondToChallengeInput): Promise<CognitoAuthResult> {
    try {
      const clientId = this.getClientId();
      const challengeResponses = { ...input.challengeResponses };

      if (challengeResponses.USERNAME && this.options.clientSecret) {
        challengeResponses.SECRET_HASH = this.getSecretHash(challengeResponses.USERNAME)!;
      }

      const command = new RespondToAuthChallengeCommand({
        ClientId: clientId,
        ChallengeName: input.challengeName as ChallengeNameType,
        Session: input.session,
        ChallengeResponses: challengeResponses,
        ClientMetadata: input.clientMetadata,
      });

      const response = await this.client.send(command);

      if (response.AuthenticationResult) {
        const tokens: CognitoTokens = {
          accessToken: response.AuthenticationResult.AccessToken || '',
          idToken: response.AuthenticationResult.IdToken || '',
          refreshToken: response.AuthenticationResult.RefreshToken,
          expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
          tokenType: response.AuthenticationResult.TokenType || 'Bearer',
        };
        return { isChallenge: false, tokens };
      }

      if (response.ChallengeName) {
        return {
          isChallenge: true,
          challenge: {
            challengeName: response.ChallengeName,
            session: response.Session || '',
            challengeParameters: response.ChallengeParameters || {},
          },
        };
      }

      throw new CognitoInternalException('RespondToAuthChallenge returned neither tokens nor subsequent challenge');
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to respond to challenge '${input.challengeName}'`);
    }
  }

  /**
   * Requests a password reset code for a forgotten password.
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordCommandOutput> {
    try {
      const clientId = this.getClientId();
      const secretHash = this.getSecretHash(input.username);

      const command = new ForgotPasswordCommand({
        ClientId: clientId,
        SecretHash: secretHash,
        Username: input.username,
        ClientMetadata: input.clientMetadata,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Forgot password request failed for user '${input.username}'`);
    }
  }

  /**
   * Confirms password reset with verification code and new password.
   */
  async confirmForgotPassword(input: ConfirmForgotPasswordInput): Promise<ConfirmForgotPasswordCommandOutput> {
    try {
      const clientId = this.getClientId();
      const secretHash = this.getSecretHash(input.username);

      const command = new ConfirmForgotPasswordCommand({
        ClientId: clientId,
        SecretHash: secretHash,
        Username: input.username,
        ConfirmationCode: input.confirmationCode,
        Password: input.newPassword,
        ClientMetadata: input.clientMetadata,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Confirm forgot password failed for user '${input.username}'`);
    }
  }

  /**
   * Changes the password for an authenticated user using an active access token.
   */
  async changePassword(input: ChangePasswordInput): Promise<ChangePasswordCommandOutput> {
    try {
      const command = new ChangePasswordCommand({
        AccessToken: input.accessToken,
        PreviousPassword: input.previousPassword,
        ProposedPassword: input.proposedPassword,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, 'Change password failed');
    }
  }

  /**
   * Signs the user out globally, revoking all active refresh and access tokens.
   */
  async signOut(accessToken: string): Promise<GlobalSignOutCommandOutput> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, 'Global sign out failed');
    }
  }
}
