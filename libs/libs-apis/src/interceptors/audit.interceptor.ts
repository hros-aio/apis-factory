import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService, RequestContextService } from '@new-hros/libs-core';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const isMutative = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    return next.handle().pipe(
      tap((data) => {
        if (isMutative) {
          const user = RequestContextService.getUser();
          const action = `${method} ${request.originalUrl || request.url}`;
          const actor = user?.userId || 'anonymous';
          const details = {
            ip: request.ip,
            statusCode: context.switchToHttp().getResponse().statusCode,
          };
          this.logger.audit(action, actor, details);
        }
      }),
    );
  }
}
