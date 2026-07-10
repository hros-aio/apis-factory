import { Inject, Injectable } from '@nestjs/common';
import { ApisModuleOptions, UnauthorizedException } from '@new-hros/libs-core';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(
    @Inject('ApisModuleOptions')
    private readonly options: ApisModuleOptions,
  ) {}

  verify(token: string) {
    const publicKey = this.options.auth?.publicKey;
    if (!publicKey) {
      throw new UnauthorizedException('Public key is not configured');
    }

    try {
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as any;

      if (!decoded || typeof decoded !== 'object') {
        throw new UnauthorizedException('Invalid token payload');
      }

      const sessionId = decoded.sessionId;
      const tenantCode = decoded.tenantCode;

      if (!sessionId) {
        throw new UnauthorizedException('Session ID is missing from token');
      }

      if (!tenantCode) {
        throw new UnauthorizedException('Tenant code is missing from token');
      }

      return {
        sessionId,
        tenantCode,
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException(`Invalid authentication token: ${err.message}`);
    }
  }
}
