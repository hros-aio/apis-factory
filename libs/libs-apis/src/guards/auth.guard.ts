import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthContext,
  CACHE_KEY_BUILDER,
  CACHE_PROVIDER_TOKEN,
  CacheProvider,
  PermissionDeniedException,
  RequestContextService,
  UnauthorizedException,
} from '@new-hros/libs-core';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_PROVIDER_TOKEN)
    private readonly cacheService: CacheProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.sessionId;
    if (!sessionId) {
      throw new UnauthorizedException('Authentication context is missing');
    }

    const cacheKey = CACHE_KEY_BUILDER.session(sessionId);
    const sessionData = await this.cacheService.get<{ user: AuthContext }>(cacheKey);

    if (!sessionData || !sessionData.user) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const contextTenantCode = RequestContextService.getTenantCode();
    if (request.tenantCode !== contextTenantCode) {
      throw new PermissionDeniedException('Tenant context boundary violation');
    }

    // Attach session user context to the request object
    request.user = sessionData.user;

    const requestCtx = RequestContextService.current();
    if (requestCtx) {
      requestCtx.user = request.user;
      requestCtx.tenantCode = request.tenantCode;
    }

    return true;
  }
}
