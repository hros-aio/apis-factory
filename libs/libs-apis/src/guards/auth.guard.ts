import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticationStrategy } from './auth-strategy.interface';
import { RequestContextService, UnauthorizedException, PermissionDeniedException } from '@new-hros/libs-core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('AuthenticationStrategy')
    private readonly authStrategy: AuthenticationStrategy,
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

    const contextTenantCode = RequestContextService.getTenantCode();
    if (contextTenantCode && contextTenantCode !== 'default' && authContext.tenantCode !== contextTenantCode) {
      throw new PermissionDeniedException('Tenant context boundary violation');
    }

    const requestCtx = RequestContextService.current();
    if (requestCtx) {
      requestCtx.user = authContext;
      requestCtx.tenantCode = authContext.tenantCode;
    }

    return true;
  }
}
