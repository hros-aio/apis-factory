import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '@new-hros/libs-core';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.debug(`Metrics latency: ${duration}ms`, 'Metrics');
      }),
    );
  }
}
