import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthContext,
  CACHE_KEY_BUILDER,
  CacheService,
  PermissionDeniedException,
  RequestContextService,
  UnauthorizedException,
} from '@new-hros/libs-core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requestCtx = RequestContextService.current();
    if (!requestCtx?.user?.sessionId) {
      throw new UnauthorizedException('Session identifier is missing');
    }

    const cacheKey = CACHE_KEY_BUILDER.buildSession(requestCtx.user.sessionId);
    const sessionData = await this.cacheService.get<AuthContext>(cacheKey);

    if (!sessionData) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    if (requestCtx.tenantCode !== sessionData.tenantCode) {
      throw new PermissionDeniedException('Tenant context boundary violation');
    }

    // Attach session user context to the request context
    requestCtx.user = sessionData;
    RequestContextService.set('user', sessionData)

    return true;
  }
}
