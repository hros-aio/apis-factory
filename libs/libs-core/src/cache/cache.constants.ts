export const CACHE_NAMESPACE = {
  SESSION: 'auth:session',
  USER_SESSIONS: 'auth:user-sessions',
  USER_AUTHZ: 'authz:user',
  ROLE_AUTHZ: 'authz:role',
};

export const CACHE_KEY_BUILDER = {
  buildSession: (sessionId: string) => `${CACHE_NAMESPACE.SESSION}:${sessionId}`,
  buildUserSessions: (
    tenantCode: string,
    userId: string,
    opt?: {
      useHashTag?: true;
    },
  ) => {
    if (opt?.useHashTag) {
      return `${CACHE_NAMESPACE.USER_SESSIONS}:{${tenantCode}:${userId}}`;
    }
    return `${CACHE_NAMESPACE.USER_SESSIONS}:${tenantCode}:${userId}`;
  },
  buildUserAuthz: (tenantCode: string, userId: string) =>
    `${CACHE_NAMESPACE.USER_AUTHZ}:${tenantCode}:${userId}`,
  buildRoleAuthz: (tenantCode: string, roleId: string) =>
    `${CACHE_NAMESPACE.ROLE_AUTHZ}:${tenantCode}:${roleId}`,
};

export const CACHE_MODULE_OPTIONS_TOKEN = Symbol('CACHE_MODULE_OPTIONS');
