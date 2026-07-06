import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService, RequestContext } from '@new-hros/libs-core';
import * as crypto from 'crypto';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    const tenantCode = (req.headers['x-tenant-code'] as string) || 'default';
    const serviceName = 'api-service';

    const context: RequestContext = {
      traceId,
      requestId,
      serviceName,
      tenantCode,
      requestTimestamp: new Date(),
      clientMetadata: {
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
      },
    };

    res.setHeader('x-trace-id', traceId);
    res.setHeader('x-request-id', requestId);

    RequestContextService.run(context, () => {
      next();
    });
  }
}
