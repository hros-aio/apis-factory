import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestContext, RequestContextService } from '@new-hros/libs-core';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    const tenantCode = (req.headers['x-tenant-code'] as string) || 'default';

    const context: RequestContext = {
      traceId,
      requestId,
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
