export class BaseException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EventPublishException extends BaseException {
  constructor(message: string, public readonly originalError?: any) {
    super(message, 'EVENT_PUBLISH_ERROR');
    if (originalError) {
      this.stack += `\nCaused by: ${originalError.stack || originalError.message || originalError}`;
    }
  }
}
