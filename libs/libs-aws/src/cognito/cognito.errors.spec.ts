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
    const awsErr = { name: 'UserNotFoundException', message: 'User does not exist' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoUserNotFoundException);
    expect(mapped.code).toBe('USER_NOT_FOUND');
    expect(mapped.message).toBe('User does not exist');
    expect(mapped.cause).toBe(awsErr);
  });

  it('should map UsernameExistsException', () => {
    const awsErr = { name: 'UsernameExistsException', message: 'User already exists' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoUserAlreadyExistsException);
    expect(mapped.code).toBe('USER_ALREADY_EXISTS');
  });

  it('should map NotAuthorizedException', () => {
    const awsErr = { name: 'NotAuthorizedException', message: 'Incorrect username or password' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoNotAuthorizedException);
    expect(mapped.code).toBe('NOT_AUTHORIZED');
  });

  it('should map InvalidPasswordException', () => {
    const awsErr = { name: 'InvalidPasswordException', message: 'Password is too short' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoInvalidPasswordException);
    expect(mapped.code).toBe('INVALID_PASSWORD');
  });

  it('should map CodeMismatchException', () => {
    const awsErr = { name: 'CodeMismatchException', message: 'Invalid code' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoCodeMismatchException);
    expect(mapped.code).toBe('CODE_MISMATCH');
  });

  it('should map ExpiredCodeException', () => {
    const awsErr = { name: 'ExpiredCodeException', message: 'Code expired' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoCodeExpiredException);
    expect(mapped.code).toBe('CODE_EXPIRED');
  });

  it('should map PasswordResetRequiredException', () => {
    const awsErr = { name: 'PasswordResetRequiredException', message: 'Reset password' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoPasswordResetRequiredException);
    expect(mapped.code).toBe('PASSWORD_RESET_REQUIRED');
  });

  it('should map UserNotConfirmedException', () => {
    const awsErr = { name: 'UserNotConfirmedException', message: 'Not confirmed' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoUserNotConfirmedException);
    expect(mapped.code).toBe('USER_NOT_CONFIRMED');
  });

  it('should support AWS __type field fallback', () => {
    const awsErr = { __type: 'UserNotFoundException', message: 'Found via __type' };
    const mapped = CognitoErrorMapper.map(awsErr);
    expect(mapped).toBeInstanceOf(CognitoUserNotFoundException);
  });

  it('should fallback to CognitoInternalException for unmapped or generic errors', () => {
    const generic = new Error('Unknown AWS glitch');
    const mapped = CognitoErrorMapper.map(generic);
    expect(mapped).toBeInstanceOf(CognitoInternalException);
    expect(mapped.code).toBe('INTERNAL_ERROR');
    expect(mapped.message).toBe('Unknown AWS glitch');
    expect(mapped.cause).toBe(generic);
  });

  it('should not inherit from NestJS HttpException', () => {
    const exc = new CognitoInternalException('Test');
    expect(exc).toBeInstanceOf(Error);
    expect(exc).toBeInstanceOf(CognitoException);
    expect((exc as any).getStatus).toBeUndefined();
    expect((exc as any).getResponse).toBeUndefined();
  });
});
