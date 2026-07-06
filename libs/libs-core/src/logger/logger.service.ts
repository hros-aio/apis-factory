export abstract class LoggerService {
  abstract debug(message: string, context?: string): void;
  abstract info(message: string, context?: string): void;
  abstract warn(message: string, context?: string): void;
  abstract error(message: string, trace?: string, context?: string): void;
  abstract audit(action: string, actor: string, details: any): void;
  abstract security(
    event: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: any,
  ): void;
}
