import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CACHE_KEY_BUILDER,
  CachedRoleData,
  CacheService,
  RequestContextService,
  ResourceContext,
  UserAuthorizationProfile,
  CumulativeAccessEvaluator,
} from '@new-hros/libs-core';
import { Request } from 'express';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = RequestContextService.getUser();
    const tenantCode = RequestContextService.getTenantCode();
    if (!user || !tenantCode) {
      this.logger.warn(
        'AuthorizationGuard failed: missing tenantCode or userId in request context',
      );
      throw new ForbiddenException('AUTHZ_PERMISSION_DENIED');
    }

    const userProfile = await this.resolveUserProfile(tenantCode, user.userId);
    if (!userProfile || !userProfile.roles || userProfile.roles.length === 0) {
      throw new ForbiddenException('AUTHZ_STORE_UNAVAILABLE');
    }

    // Resolve permissions for all user roles using L1 -> Redis -> DB
    const rolePermissionsMap = new Map<string, string[]>();
    for (const roleAssignment of userProfile.roles) {
      const perms = await this.resolveRolePermissions(tenantCode, roleAssignment.roleId);
      rolePermissionsMap.set(roleAssignment.roleId, perms);
    }

    const request = context.switchToHttp().getRequest();
    const targetResource = this.fetchTargetResource(request);

    // Every required permission in the decorator must be satisfied by cumulative evaluator
    for (const perm of requiredPermissions) {
      const allowed = CumulativeAccessEvaluator.evaluateAccess(
        perm,
        userProfile.roles,
        rolePermissionsMap,
        targetResource,
        user.employee?.employeeId,
      );

      if (!allowed) {
        this.logger.debug(`Access denied for user ${user.userId} on permission ${perm}`);
        throw new ForbiddenException('AUTHZ_PERMISSION_DENIED');
      }
    }

    return true;
  }

  private async resolveRolePermissions(tenantCode: string, roleId: string): Promise<string[]> {
    const key = CACHE_KEY_BUILDER.buildRoleAuthz(tenantCode, roleId);
    const cachedRole = await this.cacheService.get<CachedRoleData>(key);

    return cachedRole?.permissions.map((p) => p.code) || [];
  }

  private async resolveUserProfile(
    tenantCode: string,
    userId: string,
  ): Promise<UserAuthorizationProfile | null> {
    const key = CACHE_KEY_BUILDER.buildUserAuthz(tenantCode, userId);
    return this.cacheService.get<UserAuthorizationProfile>(key);
  }

  private fetchTargetResource(req: Request): ResourceContext {
    return {
      employeeId: req.params?.employeeId || req.params?.id || req.body?.employeeId,
      managerId: req.params?.managerId || req.body?.managerId,
      companyId: req.params?.companyId || req.body?.companyId,
      locationId: req.params?.locationId || req.body?.locationId,
      departmentId: req.params?.departmentId || req.body?.departmentId,
    };
  }
}
