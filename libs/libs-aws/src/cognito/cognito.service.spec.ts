import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminSetUserPasswordCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoService } from './cognito.service';
import { CognitoModuleOptions } from './cognito.types';
import {
  CognitoUserNotFoundException,
  CognitoUserAlreadyExistsException,
} from './cognito.errors';

describe('CognitoService', () => {
  let service: CognitoService;
  let mockSend: jest.Mock;
  let mockClient: CognitoIdentityProviderClient;
  const poolId = 'us-east-1_mockPoolId';

  const options: CognitoModuleOptions = {
    region: 'us-east-1',
    userPoolId: poolId,
  };

  beforeEach(() => {
    mockSend = jest.fn();
    mockClient = {
      send: mockSend,
      destroy: jest.fn(),
    } as unknown as CognitoIdentityProviderClient;

    service = new CognitoService(options, mockClient);
  });

  describe('createUser', () => {
    it('should create user and automatically attach configured userPoolId', async () => {
      mockSend.mockResolvedValueOnce({
        User: {
          Username: 'john.doe',
          Enabled: true,
          UserStatus: 'CONFIRMED',
          Attributes: [
            { Name: 'email', Value: 'john.doe@example.com' },
            { Name: 'sub', Value: 'sub-123' },
          ],
        },
      });

      const result = await service.createUser({
        username: 'john.doe',
        temporaryPassword: 'TempPassword123!',
        userAttributes: {
          email: 'john.doe@example.com',
        },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(AdminCreateUserCommand);
      expect(command.input.UserPoolId).toBe(poolId);
      expect(command.input.Username).toBe('john.doe');
      expect(command.input.TemporaryPassword).toBe('TempPassword123!');
      expect(command.input.UserAttributes).toEqual([
        { Name: 'email', Value: 'john.doe@example.com' },
      ]);

      expect(result.username).toBe('john.doe');
      expect(result.attributes.email).toBe('john.doe@example.com');
      expect(result.enabled).toBe(true);
      expect(result.userStatus).toBe('CONFIRMED');
    });

    it('should support AttributeType[] array directly', async () => {
      mockSend.mockResolvedValueOnce({
        User: {
          Username: 'alice',
          Attributes: [{ Name: 'email', Value: 'alice@example.com' }],
        },
      });

      await service.createUser({
        username: 'alice',
        userAttributes: [{ Name: 'email', Value: 'alice@example.com' }],
      });

      const command = mockSend.mock.calls[0][0];
      expect(command.input.UserAttributes).toEqual([
        { Name: 'email', Value: 'alice@example.com' },
      ]);
    });

    it('should map UsernameExistsException to CognitoUserAlreadyExistsException', async () => {
      const awsError = new Error('User already exists');
      awsError.name = 'UsernameExistsException';
      mockSend.mockRejectedValueOnce(awsError);

      await expect(
        service.createUser({ username: 'existing.user' }),
      ).rejects.toThrow(CognitoUserAlreadyExistsException);
    });
  });

  describe('getUser', () => {
    it('should retrieve user details and normalize attributes', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'john.doe',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'email', Value: 'john.doe@example.com' },
          { Name: 'custom:role', Value: 'admin' },
        ],
      });

      const result = await service.getUser('john.doe');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            UserPoolId: poolId,
            Username: 'john.doe',
          }),
        }),
      );
      expect(result.attributes['email']).toBe('john.doe@example.com');
      expect(result.attributes['custom:role']).toBe('admin');
    });

    it('should map UserNotFoundException to CognitoUserNotFoundException', async () => {
      const awsError = new Error('User does not exist');
      awsError.name = 'UserNotFoundException';
      mockSend.mockRejectedValueOnce(awsError);

      await expect(service.getUser('unknown.user')).rejects.toThrow(
        CognitoUserNotFoundException,
      );
    });
  });

  describe('listUsers', () => {
    it('should list users with pagination token and limits', async () => {
      mockSend.mockResolvedValueOnce({
        Users: [
          {
            Username: 'user1',
            Attributes: [{ Name: 'email', Value: 'u1@example.com' }],
          },
          {
            Username: 'user2',
            Attributes: [{ Name: 'email', Value: 'u2@example.com' }],
          },
        ],
        PaginationToken: 'next-page-token',
      });

      const result = await service.listUsers({
        limit: 10,
        paginationToken: 'prev-token',
        filter: 'email ^= "u"',
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(ListUsersCommand);
      expect(command.input.UserPoolId).toBe(poolId);
      expect(command.input.Limit).toBe(10);
      expect(command.input.PaginationToken).toBe('prev-token');
      expect(command.input.Filter).toBe('email ^= "u"');

      expect(result.users).toHaveLength(2);
      expect(result.paginationToken).toBe('next-page-token');
      expect(result.users[0].username).toBe('user1');
    });
  });

  describe('updateUser', () => {
    it('should dispatch AdminUpdateUserAttributesCommand with normalized attributes', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.updateUser('john.doe', {
        family_name: 'Doe',
        given_name: 'John',
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(AdminUpdateUserAttributesCommand);
      expect(command.input.UserPoolId).toBe(poolId);
      expect(command.input.Username).toBe('john.doe');
      expect(command.input.UserAttributes).toEqual([
        { Name: 'family_name', Value: 'Doe' },
        { Name: 'given_name', Value: 'John' },
      ]);
    });
  });

  describe('deleteUser', () => {
    it('should dispatch AdminDeleteUserCommand', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.deleteUser('john.doe');

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(AdminDeleteUserCommand);
      expect(command.input.UserPoolId).toBe(poolId);
      expect(command.input.Username).toBe('john.doe');
    });
  });

  describe('enableUser and disableUser', () => {
    it('should dispatch AdminEnableUserCommand', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.enableUser('john.doe');

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(AdminEnableUserCommand);
      expect(command.input.UserPoolId).toBe(poolId);
    });

    it('should dispatch AdminDisableUserCommand', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.disableUser('john.doe');

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(AdminDisableUserCommand);
      expect(command.input.UserPoolId).toBe(poolId);
    });
  });

  describe('setUserPassword', () => {
    it('should dispatch AdminSetUserPasswordCommand with permanent flag', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.setUserPassword({
        username: 'john.doe',
        password: 'PermanentPassword789!',
        permanent: true,
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(AdminSetUserPasswordCommand);
      expect(command.input.UserPoolId).toBe(poolId);
      expect(command.input.Username).toBe('john.doe');
      expect(command.input.Password).toBe('PermanentPassword789!');
      expect(command.input.Permanent).toBe(true);
    });
  });

  describe('adminSignOut', () => {
    it('should dispatch AdminUserGlobalSignOutCommand', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.adminSignOut('john.doe');

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(AdminUserGlobalSignOutCommand);
      expect(command.input.UserPoolId).toBe(poolId);
      expect(command.input.Username).toBe('john.doe');
    });

    it('should map errors in adminSignOut, deleteUser, enableUser, disableUser, setUserPassword', async () => {
      const err = new Error('Failure');
      mockSend.mockRejectedValue(err);

      await expect(service.updateUser('john.doe', {})).rejects.toThrow();
      await expect(service.deleteUser('john.doe')).rejects.toThrow();
      await expect(service.enableUser('john.doe')).rejects.toThrow();
      await expect(service.disableUser('john.doe')).rejects.toThrow();
      await expect(service.setUserPassword({ username: 'u', password: 'p' })).rejects.toThrow();
      await expect(service.adminSignOut('john.doe')).rejects.toThrow();
      await expect(service.listUsers()).rejects.toThrow();
    });

    it('should handle undefined attributes and null user response safely', async () => {
      mockSend.mockResolvedValueOnce({
        User: undefined,
      });

      await expect(
        service.createUser({ username: 'no-user' }),
      ).rejects.toThrow('No user data returned from Cognito');
    });
  });
});
