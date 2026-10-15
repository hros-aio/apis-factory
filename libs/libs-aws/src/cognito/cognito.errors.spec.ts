import {
  CognitoErrorMapper,
  CognitoException,
  CognitoUserNotFoundException,
  CognitoUserAlreadyExistsException,
  CognitoNotAuthorizedException,
  CognitoInvalidPasswordException,
  CognitoCodeMismatchException,
  CognitoCodeExpiredException,
  CognitoPasswordResetRequiredException,
  CognitoUserNotConfirmedException,
  CognitoInternalException,
} from './cognito.errors';

describe('CognitoErrorMapper', () => {
  it('should return the exception directly if already a CognitoException', () => {
    const existing = new CognitoUserNotFoundException('User missing');
    const mapped = CognitoErrorMapper.map(existing);
    expect(mapped).toBe(existing);
    expect(mapped.code).toBe('USER_NOT_FOUND');
  });

  it('should map UserNotFoundException', () => {
    const awsErr = { name: 'UserNotFoundException', message: 'Internal pool error: user 123' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoUserNotFoundException);
    expect(mapped.code).toBe('USER_NOT_FOUND');
    expect(mapped.message).toBe('User does not exist');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should map UsernameExistsException with safe message', () => {
    const awsErr = { name: 'UsernameExistsException', message: 'Raw AWS conflict details' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoUserAlreadyExistsException);
    expect(mapped.code).toBe('USER_ALREADY_EXISTS');
    expect(mapped.message).toBe('User already exists');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should map NotAuthorizedException with safe message', () => {
    const awsErr = { name: 'NotAuthorizedException', message: 'Incorrect username or password' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoNotAuthorizedException);
    expect(mapped.code).toBe('NOT_AUTHORIZED');
    expect(mapped.message).toBe('Not authorized');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should map InvalidPasswordException with safe message', () => {
    const awsErr = { name: 'InvalidPasswordException', message: 'Password is too short' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoInvalidPasswordException);
    expect(mapped.code).toBe('INVALID_PASSWORD');
    expect(mapped.message).toBe('Password does not meet requirements');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should map CodeMismatchException with safe message', () => {
    const awsErr = { name: 'CodeMismatchException', message: 'Invalid code' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoCodeMismatchException);
    expect(mapped.code).toBe('CODE_MISMATCH');
    expect(mapped.message).toBe('Invalid verification code provided');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should map ExpiredCodeException with safe message', () => {
    const awsErr = { name: 'ExpiredCodeException', message: 'Code expired' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoCodeExpiredException);
    expect(mapped.code).toBe('CODE_EXPIRED');
    expect(mapped.message).toBe('Verification code has expired');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should map PasswordResetRequiredException with safe message', () => {
    const awsErr = { name: 'PasswordResetRequiredException', message: 'Reset password' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoPasswordResetRequiredException);
    expect(mapped.code).toBe('PASSWORD_RESET_REQUIRED');
    expect(mapped.message).toBe('Password reset required for user');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should map UserNotConfirmedException with safe message', () => {
    const awsErr = { name: 'UserNotConfirmedException', message: 'Not confirmed' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoUserNotConfirmedException);
    expect(mapped.code).toBe('USER_NOT_CONFIRMED');
    expect(mapped.message).toBe('User is not confirmed');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should support AWS __type field fallback', () => {
    const awsErr = { __type: 'UserNotFoundException', message: 'Found via __type' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoUserNotFoundException);
    expect(mapped.message).toBe('User does not exist');
  });

  it('should fallback to CognitoInternalException with safe message for unmapped or generic errors', () => {
    const generic = new Error('Unknown AWS internal glitch with metadata');
    const mapped = CognitoErrorMapper.map(generic);
    expect(mapped).toBeInstanceOf(CognitoInternalException);
    expect(mapped.code).toBe('INTERNAL_ERROR');
    expect(mapped.message).toBe('An unexpected Cognito error occurred');
    expect(mapped.cause).toBe(generic);

    const withCustomFallback = CognitoErrorMapper.map(generic, 'Custom safe operation message');
    expect(withCustomFallback.message).toBe('Custom safe operation message');
    expect(withCustomFallback.cause).toBe(generic);
  });

  it('should not inherit from NestJS HttpException', () => {
    const exc = new CognitoInternalException('Test');
    expect(exc).toBeInstanceOf(Error);
    expect(exc).toBeInstanceOf(CognitoException);
    expect((exc as any).getStatus).toBeUndefined();
    expect((exc as any).getResponse).toBeUndefined();
  });
});
