import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CACHE_KEY_BUILDER,
  CacheService,
  PermissionDeniedException,
  RequestContextService,
  UnauthorizedException,
} from '@new-hros/libs-core';
import { AuthenticatedUser } from 'src/interfaces/auth.interface';
import { AuthenticationStrategy } from './auth-strategy.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('AuthenticationStrategy')
    private readonly authStrategy: AuthenticationStrategy,
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

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization Bearer token is missing');
    }

    const token = authHeader.split(' ')[1];
    const authContext = await this.authStrategy.authenticate(token);

    if (!authContext.sessionId) {
      throw new UnauthorizedException('Session ID is missing from token');
    }

    const cacheKey = CACHE_KEY_BUILDER.session(authContext.sessionId);
    const sessionData = await this.cacheService.get<{ user: AuthenticatedUser }>(cacheKey);

    if (!sessionData || !sessionData.user) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const contextTenantCode = RequestContextService.getTenantCode();
    if (authContext.tenantCode !== contextTenantCode) {
      throw new PermissionDeniedException('Tenant context boundary violation');
    }

    // Attach session user context to the request object
    request.user = sessionData.user;

    const requestCtx = RequestContextService.current();
    if (requestCtx) {
      requestCtx.user = request.user;
      requestCtx.tenantCode = authContext.tenantCode;
    }

    return true;
  }
}
