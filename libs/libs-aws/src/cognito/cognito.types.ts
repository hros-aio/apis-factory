import { Type, ModuleMetadata } from '@nestjs/common';
import {
  CognitoIdentityProviderClientConfig,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { AwsCredentialIdentity } from '@aws-sdk/types';

export interface CognitoModuleOptions {
  /** AWS Region for the Cognito User Pool (e.g. 'us-east-1') */
  region: string;
  /** The Cognito User Pool ID */
  userPoolId: string;
  /** Optional App Client ID used for public authentication flows */
  clientId?: string;
  /** Optional App Client Secret for secret-enabled clients */
  clientSecret?: string;
  /** Optional explicit AWS credentials. Defaults to AWS SDK default credential provider chain */
  credentials?: AwsCredentialIdentity;
  /** Optional additional AWS SDK client configuration overrides */
  clientConfig?: Partial<CognitoIdentityProviderClientConfig>;
  /** Optional instance identifier for multi-pool differentiation */
  instanceName?: string;
  /** Optional flag indicating whether the App Client uses refresh token rotation */
  refreshTokenRotation?: boolean;
}

export interface CognitoOptionsFactory {
  createCognitoOptions(): Promise<CognitoModuleOptions> | CognitoModuleOptions;
}

export interface CognitoModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<CognitoOptionsFactory>;
  useClass?: Type<CognitoOptionsFactory>;
  useFactory?: (...args: unknown[]) => Promise<CognitoModuleOptions> | CognitoModuleOptions;
  inject?: unknown[];
  instanceName?: string;
}

export type CognitoUserStatus =
  | 'UNCONFIRMED'
  | 'CONFIRMED'
  | 'ARCHIVED'
  | 'COMPROMISED'
  | 'RESET_REQUIRED'
  | 'FORCE_CHANGE_PASSWORD'
  | 'EXTERNAL_PROVIDER'
  | 'UNKNOWN';

export interface CognitoUserRecord {
  username: string;
  attributes: Record<string, string>;
  enabled: boolean;
  userStatus: CognitoUserStatus;
  userCreateDate?: Date;
  userLastModifiedDate?: Date;
}

export interface PaginatedUserList {
  users: CognitoUserRecord[];
  paginationToken?: string;
}

export interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface CognitoChallenge {
  challengeName: string;
  session: string;
  challengeParameters: Record<string, string>;
}

export type CognitoAuthResult =
  | { isChallenge: false; tokens: CognitoTokens }
  | { isChallenge: true; challenge: CognitoChallenge };

// DTOs for CognitoService (Administrative operations)
export interface CreateUserInput {
  username: string;
  temporaryPassword?: string;
  userAttributes?: AttributeType[] | Record<string, string>;
  messageAction?: 'RESEND' | 'SUPPRESS';
  desiredDeliveryMediums?: ('SMS' | 'EMAIL')[];
}

export interface ListUsersInput {
  limit?: number;
  paginationToken?: string;
  filter?: string;
}

export interface SetUserPasswordInput {
  username: string;
  password: string;
  permanent?: boolean;
}

// DTOs for CognitoAuthService (End-user authentication operations)
export interface SignUpInput {
  username: string;
  password: string;
  userAttributes?: AttributeType[] | Record<string, string>;
  validationData?: AttributeType[];
  clientMetadata?: Record<string, string>;
}

export interface ConfirmSignUpInput {
  username: string;
  confirmationCode: string;
  forceAliasCreation?: boolean;
  clientMetadata?: Record<string, string>;
}

export interface SignInInput {
  username: string;
  password: string;
  clientMetadata?: Record<string, string>;
}

export interface RefreshTokenInput {
  refreshToken: string;
  username?: string;
  clientMetadata?: Record<string, string>;
  /** Optional override indicating whether to use Cognito's rotation-compatible refresh API */
  refreshTokenRotation?: boolean;
}

export interface RespondToChallengeInput {
  challengeName: string;
  session: string;
  challengeResponses: Record<string, string>;
  clientMetadata?: Record<string, string>;
}

export interface ForgotPasswordInput {
  username: string;
  clientMetadata?: Record<string, string>;
}

export interface ConfirmForgotPasswordInput {
  username: string;
  confirmationCode: string;
  newPassword: string;
  clientMetadata?: Record<string, string>;
}

export interface ChangePasswordInput {
  accessToken: string;
  previousPassword: string;
  proposedPassword: string;
}
