import { Injectable } from '@nestjs/common';
import { AuthenticationStrategy } from './auth-strategy.interface';
import { AuthContext, UnauthorizedException } from '@new-hros/libs-core';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthStrategy implements AuthenticationStrategy {
  constructor(private readonly publicKey: string) {}

  async authenticate(token: string): Promise<AuthContext> {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
      }) as any;

      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid token payload');
      }

      return {
        userId: decoded.userId || decoded.sub || '',
        sessionId: decoded.sessionId || decoded.sid || '',
        tenantCode: decoded.tenantCode || decoded.tenant || '',
        roles: decoded.roles || [],
        scopes: decoded.scopes || [],
        permissions: decoded.permissions || [],
      };
    } catch (err: any) {
      throw new UnauthorizedException(`Invalid authentication token: ${err.message}`);
    }
  }
}
