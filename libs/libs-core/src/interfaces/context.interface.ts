export interface AuthContext {
  userId: string;
  sessionId: string;
  tenantCode: string;
  roles: string[];
  scopes: string[];
  permissions: string[];
}

export interface RequestContext {
  traceId: string;
  requestId: string;
  serviceName: string;
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
