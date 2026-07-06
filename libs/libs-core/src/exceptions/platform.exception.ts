export class BusinessException extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string = 'BUSINESS_ERROR',
    public readonly status: number = 400,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationException extends BusinessException {
  constructor(message: string, public readonly errors?: any) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class ConflictException extends BusinessException {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR', 409);
  }
}

export class PermissionDeniedException extends BusinessException {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED', 403);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ResourceNotFoundException extends BusinessException {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}
