import { Injectable, Inject } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminGetUserCommandOutput,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
  AdminUpdateUserAttributesCommandOutput,
  AdminDeleteUserCommand,
  AdminDeleteUserCommandOutput,
  AdminEnableUserCommand,
  AdminEnableUserCommandOutput,
  AdminDisableUserCommand,
  AdminDisableUserCommandOutput,
  AdminSetUserPasswordCommand,
  AdminSetUserPasswordCommandOutput,
  AdminUserGlobalSignOutCommand,
  AdminUserGlobalSignOutCommandOutput,
  AttributeType,
  UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { COGNITO_CLIENT } from './cognito.constants';
import { COGNITO_MODULE_OPTIONS_TOKEN } from './cognito.module-definition';
import {
  CognitoModuleOptions,
  CognitoUserRecord,
  CognitoUserStatus,
  PaginatedUserList,
  CreateUserInput,
  ListUsersInput,
  SetUserPasswordInput,
} from './cognito.types';
import { CognitoErrorMapper, CognitoInternalException } from './cognito.errors';

function normalizeAttributes(
  attributes?: AttributeType[] | Record<string, string>,
): AttributeType[] | undefined {
  if (!attributes) return undefined;
  if (Array.isArray(attributes)) return attributes;
  return Object.entries(attributes).map(([Name, Value]) => ({ Name, Value }));
}

function mapAttributesRecord(attributes?: AttributeType[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (!attributes) return result;
  for (const attr of attributes) {
    if (attr.Name && attr.Value !== undefined) {
      result[attr.Name] = attr.Value;
    }
  }
  return result;
}

function toUserRecord(user?: UserType | AdminGetUserCommandOutput): CognitoUserRecord {
  if (!user) {
    throw new CognitoInternalException('No user data returned from Cognito');
  }
  const rawAttributes =
    'UserAttributes' in user
      ? user.UserAttributes
      : (user as { Attributes?: AttributeType[] }).Attributes;
  const attributes = mapAttributesRecord(rawAttributes);

  return {
    username: user.Username || '',
    attributes,
    enabled: user.Enabled ?? true,
    userStatus: (user.UserStatus as CognitoUserStatus) || 'UNKNOWN',
    userCreateDate: user.UserCreateDate,
    userLastModifiedDate: user.UserLastModifiedDate,
  };
}

/**
 * Service for administrative management of Cognito User Pool identities.
 * Automatically and immutably enforces the configured User Pool ID.
 */
@Injectable()
export class CognitoService {
  constructor(
    @Inject(COGNITO_MODULE_OPTIONS_TOKEN) private readonly options: CognitoModuleOptions,
    @Inject(COGNITO_CLIENT) private readonly client: CognitoIdentityProviderClient,
  ) {
    if (!this.options?.userPoolId) {
      throw new Error('userPoolId must be configured in CognitoModuleOptions');
    }
  }

  /**
   * Creates a new user in the configured Cognito User Pool.
   */
  async createUser(input: CreateUserInput): Promise<CognitoUserRecord> {
    try {
      const command = new AdminCreateUserCommand({
        UserPoolId: this.options.userPoolId,
        Username: input.username,
        TemporaryPassword: input.temporaryPassword,
        UserAttributes: normalizeAttributes(input.userAttributes),
        MessageAction: input.messageAction,
        DesiredDeliveryMediums: input.desiredDeliveryMediums,
      });

      const response = await this.client.send(command);
      return toUserRecord(response.User);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to create user '${input.username}'`);
    }
  }

  /**
   * Retrieves user details from the configured Cognito User Pool.
   */
  async getUser(username: string): Promise<CognitoUserRecord> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.options.userPoolId,
        Username: username,
      });

      const response = await this.client.send(command);
      return toUserRecord(response);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to get user '${username}'`);
    }
  }

  /**
   * Lists users in the configured User Pool with optional pagination and filters.
   */
  async listUsers(input?: ListUsersInput): Promise<PaginatedUserList> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.options.userPoolId,
        Limit: input?.limit,
        PaginationToken: input?.paginationToken,
        Filter: input?.filter,
      });

      const response = await this.client.send(command);
      const users = (response.Users || []).map((u) => toUserRecord(u));

      return {
        users,
        paginationToken: response.PaginationToken,
      };
    } catch (error) {
      throw CognitoErrorMapper.map(error, 'Failed to list users');
    }
  }

  /**
   * Updates attributes for an existing user.
   */
  async updateUser(
    username: string,
    attributes: AttributeType[] | Record<string, string>,
  ): Promise<AdminUpdateUserAttributesCommandOutput> {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.options.userPoolId,
        Username: username,
        UserAttributes: normalizeAttributes(attributes),
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to update user '${username}'`);
    }
  }

  /**
   * Deletes a user account from the configured User Pool.
   */
  async deleteUser(username: string): Promise<AdminDeleteUserCommandOutput> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.options.userPoolId,
        Username: username,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to delete user '${username}'`);
    }
  }

  /**
   * Enables a disabled user account.
   */
  async enableUser(username: string): Promise<AdminEnableUserCommandOutput> {
    try {
      const command = new AdminEnableUserCommand({
        UserPoolId: this.options.userPoolId,
        Username: username,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to enable user '${username}'`);
    }
  }

  /**
   * Disables an active user account.
   */
  async disableUser(username: string): Promise<AdminDisableUserCommandOutput> {
    try {
      const command = new AdminDisableUserCommand({
        UserPoolId: this.options.userPoolId,
        Username: username,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to disable user '${username}'`);
    }
  }

  /**
   * Sets or resets a user's password administratively.
   */
  async setUserPassword(input: SetUserPasswordInput): Promise<AdminSetUserPasswordCommandOutput> {
    try {
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.options.userPoolId,
        Username: input.username,
        Password: input.password,
        Permanent: input.permanent ?? false,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to set password for user '${input.username}'`);
    }
  }

  /**
   * Signs a user out of all active sessions globally.
   */
  async adminSignOut(username: string): Promise<AdminUserGlobalSignOutCommandOutput> {
    try {
      const command = new AdminUserGlobalSignOutCommand({
        UserPoolId: this.options.userPoolId,
        Username: username,
      });

      return await this.client.send(command);
    } catch (error) {
      throw CognitoErrorMapper.map(error, `Failed to sign out user '${username}'`);
    }
  }
}
