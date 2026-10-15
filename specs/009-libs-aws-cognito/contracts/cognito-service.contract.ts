import {
  AdminCreateUserCommandOutput,
  AdminGetUserCommandOutput,
  AdminUpdateUserAttributesCommandOutput,
  AdminDeleteUserCommandOutput,
  AdminEnableUserCommandOutput,
  AdminDisableUserCommandOutput,
  AdminSetUserPasswordCommandOutput,
  AdminUserGlobalSignOutCommandOutput,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoUserRecord, PaginatedUserList } from '../data-model';

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

/**
 * Administrative user management contract for AWS Cognito User Pools.
 * The configured userPoolId is automatically and immutably applied.
 */
export interface ICognitoService {
  createUser(input: CreateUserInput): Promise<CognitoUserRecord>;
  getUser(username: string): Promise<CognitoUserRecord>;
  listUsers(input?: ListUsersInput): Promise<PaginatedUserList>;
  updateUser(
    username: string,
    attributes: AttributeType[] | Record<string, string>,
  ): Promise<AdminUpdateUserAttributesCommandOutput>;
  deleteUser(username: string): Promise<AdminDeleteUserCommandOutput>;
  enableUser(username: string): Promise<AdminEnableUserCommandOutput>;
  disableUser(username: string): Promise<AdminDisableUserCommandOutput>;
  setUserPassword(input: SetUserPasswordInput): Promise<AdminSetUserPasswordCommandOutput>;
  adminSignOut(username: string): Promise<AdminUserGlobalSignOutCommandOutput>;
}
