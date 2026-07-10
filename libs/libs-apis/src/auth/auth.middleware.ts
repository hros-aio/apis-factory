import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '@new-hros/libs-core';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header is missing');
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedException('Authorization format is invalid');
      }

      const token = parts[1];
      const { sessionId, tenantCode } = this.jwtService.verify(token);

      req.sessionId = sessionId;
      req.tenantCode = tenantCode;
    } catch (err: any) {
      this.logger.warn(`Authentication verification failed: ${err.message}`);
    }

    next();
  }
}
