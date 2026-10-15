import {
  SignUpCommandOutput,
  ConfirmSignUpCommandOutput,
  ForgotPasswordCommandOutput,
  ConfirmForgotPasswordCommandOutput,
  ChangePasswordCommandOutput,
  GlobalSignOutCommandOutput,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoAuthResult, CognitoTokens } from '../data-model';

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

/**
 * End-user authentication contract for AWS Cognito App Clients.
 * Handles USER_PASSWORD_AUTH, challenge responses, token refresh, and secret hashing.
 */
export interface ICognitoAuthService {
  signUp(input: SignUpInput): Promise<SignUpCommandOutput>;
  confirmSignUp(input: ConfirmSignUpInput): Promise<ConfirmSignUpCommandOutput>;
  signIn(input: SignInInput): Promise<CognitoAuthResult>;
  refreshToken(input: RefreshTokenInput): Promise<CognitoTokens>;
  respondToChallenge(input: RespondToChallengeInput): Promise<CognitoAuthResult>;
  forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordCommandOutput>;
  confirmForgotPassword(input: ConfirmForgotPasswordInput): Promise<ConfirmForgotPasswordCommandOutput>;
  changePassword(input: ChangePasswordInput): Promise<ChangePasswordCommandOutput>;
  signOut(accessToken: string): Promise<GlobalSignOutCommandOutput>;
}
