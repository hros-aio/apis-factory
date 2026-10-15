/**
 * Base abstract class for all Cognito domain exceptions.
 * Framework-agnostic and decoupled from HTTP status codes.
 */
export abstract class CognitoException extends Error {
  public abstract readonly code: string;

  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class CognitoUserNotFoundException extends CognitoException {
  public readonly code = 'USER_NOT_FOUND';
}

export class CognitoUserAlreadyExistsException extends CognitoException {
  public readonly code = 'USER_ALREADY_EXISTS';
}

export class CognitoNotAuthorizedException extends CognitoException {
  public readonly code = 'NOT_AUTHORIZED';
}

export class CognitoInvalidPasswordException extends CognitoException {
  public readonly code = 'INVALID_PASSWORD';
}

export class CognitoCodeMismatchException extends CognitoException {
  public readonly code = 'CODE_MISMATCH';
}

export class CognitoCodeExpiredException extends CognitoException {
  public readonly code = 'CODE_EXPIRED';
}

export class CognitoPasswordResetRequiredException extends CognitoException {
  public readonly code = 'PASSWORD_RESET_REQUIRED';
}

export class CognitoUserNotConfirmedException extends CognitoException {
  public readonly code = 'USER_NOT_CONFIRMED';
}

export class CognitoInternalException extends CognitoException {
  public readonly code = 'INTERNAL_ERROR';
}

/**
 * Centralized mapper that translates AWS SDK Cognito errors into typed domain exceptions.
 */
export class CognitoErrorMapper {
  static map(error: unknown, fallbackMessage = 'An unexpected Cognito error occurred'): CognitoException {
    if (error instanceof CognitoException) {
      return error;
    }

    const awsError = error as { name?: string; __type?: string; message?: string };
    const errorType = awsError?.name || awsError?.__type;

    switch (errorType) {
      case 'UserNotFoundException':
        return new CognitoUserNotFoundException(awsError.message || 'User does not exist', error);
      case 'UsernameExistsException':
        return new CognitoUserAlreadyExistsException(awsError.message || 'User already exists', error);
      case 'NotAuthorizedException':
        return new CognitoNotAuthorizedException(awsError.message || 'Not authorized', error);
      case 'InvalidPasswordException':
        return new CognitoInvalidPasswordException(awsError.message || 'Password does not meet requirements', error);
      case 'CodeMismatchException':
        return new CognitoCodeMismatchException(awsError.message || 'Invalid verification code provided', error);
      case 'ExpiredCodeException':
        return new CognitoCodeExpiredException(awsError.message || 'Verification code has expired', error);
      case 'PasswordResetRequiredException':
        return new CognitoPasswordResetRequiredException(awsError.message || 'Password reset required for user', error);
      case 'UserNotConfirmedException':
        return new CognitoUserNotConfirmedException(awsError.message || 'User is not confirmed', error);
      default:
        return new CognitoInternalException(awsError?.message || fallbackMessage, error);
    }
  }
}
