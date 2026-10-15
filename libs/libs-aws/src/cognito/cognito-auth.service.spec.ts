import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoAuthService } from './cognito-auth.service';
import { CognitoModuleOptions } from './cognito.types';
import { computeSecretHash } from './cognito-secret-hash';
import {
  CognitoNotAuthorizedException,
  CognitoInvalidPasswordException,
  CognitoCodeMismatchException,
  CognitoInternalException,
} from './cognito.errors';

describe('CognitoAuthService', () => {
  let service: CognitoAuthService;
  let mockSend: jest.Mock;
  let mockClient: CognitoIdentityProviderClient;

  const clientId = 'mockClientId123';
  const clientSecret = 'mockClientSecret456';
  const optionsWithSecret: CognitoModuleOptions = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_mockPoolId',
    clientId,
    clientSecret,
  };

  const optionsWithoutSecret: CognitoModuleOptions = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_mockPoolId',
    clientId,
  };

  beforeEach(() => {
    mockSend = jest.fn();
    mockClient = {
      send: mockSend,
      destroy: jest.fn(),
    } as unknown as CognitoIdentityProviderClient;

    service = new CognitoAuthService(optionsWithSecret, mockClient);
  });

  describe('signUp', () => {
    it('should calculate and include SECRET_HASH when clientSecret is configured', async () => {
      mockSend.mockResolvedValueOnce({
        UserSub: 'user-sub-123',
        UserConfirmed: false,
      });

      const expectedSecretHash = computeSecretHash('alice', clientId, clientSecret);

      const response = await service.signUp({
        username: 'alice',
        password: 'Password123!',
        userAttributes: { email: 'alice@example.com' },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(SignUpCommand);
      expect(command.input.ClientId).toBe(clientId);
      expect(command.input.Username).toBe('alice');
      expect(command.input.SecretHash).toBe(expectedSecretHash);
      expect(command.input.Password).toBe('Password123!');
      expect(response.UserSub).toBe('user-sub-123');
    });

    it('should omit SECRET_HASH when clientSecret is not configured', async () => {
      const secretlessService = new CognitoAuthService(optionsWithoutSecret, mockClient);
      mockSend.mockResolvedValueOnce({ UserConfirmed: true });

      await secretlessService.signUp({
        username: 'bob',
        password: 'Password123!',
      });

      const command = mockSend.mock.calls[0][0];
      expect(command.input.SecretHash).toBeUndefined();
    });

    it('should map InvalidPasswordException', async () => {
      const error = new Error('Password must have uppercase');
      error.name = 'InvalidPasswordException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        service.signUp({ username: 'alice', password: 'weak' }),
      ).rejects.toThrow(CognitoInvalidPasswordException);
    });
  });

  describe('confirmSignUp', () => {
    it('should confirm sign up with confirmation code and secret hash', async () => {
      mockSend.mockResolvedValueOnce({});
      const expectedSecretHash = computeSecretHash('alice', clientId, clientSecret);

      await service.confirmSignUp({
        username: 'alice',
        confirmationCode: '123456',
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(ConfirmSignUpCommand);
      expect(command.input.ConfirmationCode).toBe('123456');
      expect(command.input.SecretHash).toBe(expectedSecretHash);
    });

    it('should map CodeMismatchException', async () => {
      const error = new Error('Invalid code');
      error.name = 'CodeMismatchException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        service.confirmSignUp({ username: 'alice', confirmationCode: '000000' }),
      ).rejects.toThrow(CognitoCodeMismatchException);
    });
  });

  describe('signIn', () => {
    it('should return authentication tokens when authentication succeeds directly', async () => {
      mockSend.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'access-token-123',
          IdToken: 'id-token-456',
          RefreshToken: 'refresh-token-789',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
      });

      const expectedSecretHash = computeSecretHash('john.doe', clientId, clientSecret);

      const result = await service.signIn({
        username: 'john.doe',
        password: 'Password123!',
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(InitiateAuthCommand);
      expect(command.input.AuthFlow).toBe('USER_PASSWORD_AUTH');
      expect(command.input.AuthParameters.USERNAME).toBe('john.doe');
      expect(command.input.AuthParameters.PASSWORD).toBe('Password123!');
      expect(command.input.AuthParameters.SECRET_HASH).toBe(expectedSecretHash);

      expect(result.isChallenge).toBe(false);
      if (!result.isChallenge) {
        expect(result.tokens.accessToken).toBe('access-token-123');
        expect(result.tokens.idToken).toBe('id-token-456');
        expect(result.tokens.refreshToken).toBe('refresh-token-789');
        expect(result.tokens.expiresIn).toBe(3600);
      }
    });

    it('should return challenge details when NEW_PASSWORD_REQUIRED is returned', async () => {
      mockSend.mockResolvedValueOnce({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: 'session-token-xyz',
        ChallengeParameters: {
          USER_ID_FOR_SRP: 'john.doe',
          requiredAttributes: '[]',
        },
      });

      const result = await service.signIn({
        username: 'john.doe',
        password: 'TempPassword123!',
      });

      expect(result.isChallenge).toBe(true);
      if (result.isChallenge) {
        expect(result.challenge.challengeName).toBe('NEW_PASSWORD_REQUIRED');
        expect(result.challenge.session).toBe('session-token-xyz');
        expect(result.challenge.challengeParameters.USER_ID_FOR_SRP).toBe('john.doe');
      }
    });

    it('should map NotAuthorizedException', async () => {
      const error = new Error('Incorrect username or password.');
      error.name = 'NotAuthorizedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        service.signIn({ username: 'john.doe', password: 'wrong' }),
      ).rejects.toThrow(CognitoNotAuthorizedException);
    });
  });

  describe('respondToChallenge', () => {
    it('should dispatch RespondToAuthChallengeCommand and attach SECRET_HASH if username is in responses', async () => {
      mockSend.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
        },
      });

      const expectedSecretHash = computeSecretHash('john.doe', clientId, clientSecret);

      const result = await service.respondToChallenge({
        challengeName: 'NEW_PASSWORD_REQUIRED',
        session: 'session-token-xyz',
        challengeResponses: {
          USERNAME: 'john.doe',
          NEW_PASSWORD: 'PermanentPassword456#',
        },
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(RespondToAuthChallengeCommand);
      expect(command.input.ChallengeName).toBe('NEW_PASSWORD_REQUIRED');
      expect(command.input.Session).toBe('session-token-xyz');
      expect(command.input.ChallengeResponses.SECRET_HASH).toBe(expectedSecretHash);
      expect(result.isChallenge).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should execute REFRESH_TOKEN_AUTH flow and return fresh tokens', async () => {
      mockSend.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'refreshed-access-token',
          IdToken: 'refreshed-id-token',
          RefreshToken: 'rotated-refresh-token',
          ExpiresIn: 3600,
        },
      });

      const tokens = await service.refreshToken({
        refreshToken: 'old-refresh-token',
        username: 'john.doe',
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(InitiateAuthCommand);
      expect(command.input.AuthFlow).toBe('REFRESH_TOKEN_AUTH');
      expect(command.input.AuthParameters.REFRESH_TOKEN).toBe('old-refresh-token');
      expect(command.input.AuthParameters.SECRET_HASH).toBeDefined();

      expect(tokens.accessToken).toBe('refreshed-access-token');
      expect(tokens.refreshToken).toBe('rotated-refresh-token');
    });

    it('should fallback to input refresh token if Cognito does not rotate the refresh token', async () => {
      mockSend.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'refreshed-access-token',
          IdToken: 'refreshed-id-token',
          ExpiresIn: 3600,
        },
      });

      const tokens = await service.refreshToken({
        refreshToken: 'retained-refresh-token',
      });

      expect(tokens.refreshToken).toBe('retained-refresh-token');
    });
  });

  describe('forgotPassword and confirmForgotPassword', () => {
    it('should initiate forgot password workflow', async () => {
      mockSend.mockResolvedValueOnce({});
      const expectedSecretHash = computeSecretHash('john.doe', clientId, clientSecret);

      await service.forgotPassword({ username: 'john.doe' });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(ForgotPasswordCommand);
      expect(command.input.Username).toBe('john.doe');
      expect(command.input.SecretHash).toBe(expectedSecretHash);
    });

    it('should confirm forgot password workflow', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.confirmForgotPassword({
        username: 'john.doe',
        confirmationCode: '654321',
        newPassword: 'BrandNewPassword123!',
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(ConfirmForgotPasswordCommand);
      expect(command.input.ConfirmationCode).toBe('654321');
      expect(command.input.Password).toBe('BrandNewPassword123!');
    });
  });

  describe('changePassword', () => {
    it('should dispatch ChangePasswordCommand with access token', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.changePassword({
        accessToken: 'active-access-token',
        previousPassword: 'OldPassword123!',
        proposedPassword: 'NewPassword456#',
      });

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(ChangePasswordCommand);
      expect(command.input.AccessToken).toBe('active-access-token');
      expect(command.input.PreviousPassword).toBe('OldPassword123!');
      expect(command.input.ProposedPassword).toBe('NewPassword456#');
    });
  });

  describe('signOut', () => {
    it('should dispatch GlobalSignOutCommand with access token', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.signOut('active-access-token');

      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(GlobalSignOutCommand);
      expect(command.input.AccessToken).toBe('active-access-token');
    });
  });

  describe('Missing clientId error', () => {
    it('should throw when clientId is missing on auth actions', async () => {
      const invalidService = new CognitoAuthService(
        { region: 'us-east-1', userPoolId: 'pool-1' },
        mockClient,
      );

      await expect(
        invalidService.signIn({ username: 'u', password: 'p' }),
      ).rejects.toThrow(CognitoInternalException);
    });
  });

  describe('Error handling across auth operations', () => {
    it('should map errors in forgotPassword, confirmForgotPassword, changePassword, signOut', async () => {
      const err = new Error('Auth failure');
      mockSend.mockRejectedValue(err);

      await expect(service.forgotPassword({ username: 'u' })).rejects.toThrow();
      await expect(service.confirmForgotPassword({ username: 'u', confirmationCode: 'c', newPassword: 'p' })).rejects.toThrow();
      await expect(service.changePassword({ accessToken: 'a', previousPassword: 'p', proposedPassword: 'p' })).rejects.toThrow();
      await expect(service.signOut('a')).rejects.toThrow();
      await expect(service.refreshToken({ refreshToken: 'r' })).rejects.toThrow();
    });

    it('should throw when signIn returns empty response without tokens or challenge', async () => {
      mockSend.mockResolvedValueOnce({});
      await expect(service.signIn({ username: 'u', password: 'p' })).rejects.toThrow(
        'InitiateAuth returned neither tokens nor challenge',
      );
    });

    it('should throw when respondToChallenge returns empty response without tokens or challenge', async () => {
      mockSend.mockResolvedValueOnce({});
      await expect(
        service.respondToChallenge({
          challengeName: 'SMS_MFA',
          session: 's',
          challengeResponses: {},
        }),
      ).rejects.toThrow('RespondToAuthChallenge returned neither tokens nor subsequent challenge');
    });

    it('should throw when refreshToken flow returns no AuthenticationResult', async () => {
      mockSend.mockResolvedValueOnce({});
      await expect(service.refreshToken({ refreshToken: 'r' })).rejects.toThrow(
        'RefreshToken flow did not return authentication tokens',
      );
    });
  });
});
