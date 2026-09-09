export type ScopeType =
  | 'SELF'
  | 'DIRECT_REPORTEES'
  | 'COMPANY'
  | 'LOCATION'
  | 'DEPARTMENT'
  | 'TENANT'
  | 'TENANT_WIDE';

export interface ScopeConstraint {
  type: ScopeType;
  refId: string | null;
}

export interface EffectiveUserRole {
  roleId: string;
  scope: ScopeConstraint;
  sourceGroupId: string;
}

export interface UserAuthorizationProfile {
  version: number;
  roles: EffectiveUserRole[];
}

export interface ResourceContext {
  employeeId?: string;
  managerId?: string;
  companyId?: string;
  locationId?: string;
  departmentId?: string;
}

export interface CachedRoleData {
  roleId: string;
  tenantCode: string;
  name: string;
  version: number;
  permissions: {
    code: string;
    isProtected: boolean;
  }[];
  updatedAt: string;
}
