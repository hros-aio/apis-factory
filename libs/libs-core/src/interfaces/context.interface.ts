export interface EmployeeContext {
  employeeId: string;
  companyId: string;
  locationId: string;
  departmentId: string;
  managerId: string;
}

export interface AuthContext {
  userId: string;
  sessionId: string;
  tenantCode: string;
  roles: string[];
  scopes: string[];
  permissions: string[];
  employee?: EmployeeContext;
}

export interface RequestContext {
  traceId: string;
  requestId: string;
  tenantCode: string;
  companyId?: string;
  user?: AuthContext;
  clientMetadata: {
    ip: string;
    userAgent?: string;
    [key: string]: any;
  };
  requestTimestamp: Date;
}
