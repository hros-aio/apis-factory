import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '@new-hros/libs-core';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handlerName = context.getHandler().name;
    const className = context.getClass().name;
    const startTime = Date.now();

    this.logger.debug(`Executing handler: ${className}.${handlerName}`, 'Interceptor');

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.debug(`Completed handler: ${className}.${handlerName} | Duration: ${duration}ms`, 'Interceptor');
      }),
    );
  }
}
