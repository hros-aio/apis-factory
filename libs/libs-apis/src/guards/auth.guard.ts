import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticationStrategy } from './auth-strategy.interface';
import { RequestContextService, UnauthorizedException, PermissionDeniedException, CacheService } from '@new-hros/libs-core';

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

    const cacheKey = `auth:session:${authContext.sessionId}`;
    const sessionData = await this.cacheService.get<any>(cacheKey);

    if (!sessionData) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const contextTenantCode = RequestContextService.getTenantCode();
    if (contextTenantCode && contextTenantCode !== 'default' && authContext.tenantCode !== contextTenantCode) {
      throw new PermissionDeniedException('Tenant context boundary violation');
    }

    // Attach session user context to the request object
    request.user = sessionData.user || sessionData;

    const requestCtx = RequestContextService.current();
    if (requestCtx) {
      requestCtx.user = request.user;
      requestCtx.tenantCode = authContext.tenantCode;
    }

    return true;
  }
}
