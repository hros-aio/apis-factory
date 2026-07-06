import { LoggerService } from './logger.service';

export class ConsoleLoggerService extends LoggerService {
  debug(message: string, context?: string): void {
    console.log(`[DEBUG]${context ? ` [${context}]` : ''} ${message}`);
  }

  info(message: string, context?: string): void {
    console.info(`[INFO]${context ? ` [${context}]` : ''} ${message}`);
  }

  warn(message: string, context?: string): void {
    console.warn(`[WARN]${context ? ` [${context}]` : ''} ${message}`);
  }

  error(message: string, trace?: string, context?: string): void {
    console.error(`[ERROR]${context ? ` [${context}]` : ''} ${message}${trace ? `\nTrace: ${trace}` : ''}`);
  }

  audit(action: string, actor: string, details: any): void {
    console.log(`[AUDIT] Action: ${action} | Actor: ${actor} | Details: ${JSON.stringify(details)}`);
  }

  security(
    event: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: any,
  ): void {
    console.warn(`[SECURITY] [${severity}] Event: ${event} | Details: ${JSON.stringify(details)}`);
  }
}
