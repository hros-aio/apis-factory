import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigurationService, RequestContext, RequestContextService } from '@new-hros/libs-core';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private configService: ConfigurationService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

    let tenantCode = '';
    let userId = '';
    let sessionId = '';
    try {
      const token = requestFromToken(req);
      if (!token) throw new UnauthorizedException('token missing');

      const publicKey = this.configService.get<string>('jwt.publicKey');
      if (!publicKey) throw new UnauthorizedException('JWT Private Key configuration is missing');

      const decode = jwt.verify(token, publicKey) as jwt.JwtPayload;
      tenantCode = decode['tenantCode'] ?? tenantCode
      userId = decode['sub'] ?? userId;
      sessionId = decode['sid'] ?? sessionId
    } catch (error) {
      tenantCode = (req.query?.tenantCode as string) || req.body?.tenantCode || '';
    }

    const context: RequestContext = {
      traceId,
      requestId,
      tenantCode,
      user: {
        userId,
        permissions: [],
        roles: [],
        tenantCode,
        scopes: [],
        sessionId,
      },
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

export function requestFromToken(req: Request): string {
  return req.headers['authorization']?.split('Bearer ')[1] ?? '';
}
