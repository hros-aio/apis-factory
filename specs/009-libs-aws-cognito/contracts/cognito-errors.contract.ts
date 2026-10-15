/**
 * Typed domain errors for AWS Cognito operations.
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

export interface ICognitoErrorMapper {
  map(error: unknown, fallbackMessage?: string): CognitoException;
}
