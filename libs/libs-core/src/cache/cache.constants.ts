export const CACHE_NAMESPACE = {
  SESSION: 'auth:session:',
  USER_SESSIONS: 'auth:user-sessions:',
};

export const CACHE_KEY_BUILDER = {
  session: (sessionId: string) => `${CACHE_NAMESPACE.SESSION}${sessionId}`,
  userSessions: (userId: string) => `${CACHE_NAMESPACE.USER_SESSIONS}${userId}`,
};

export const CACHE_MODULE_OPTIONS_TOKEN = Symbol('CACHE_MODULE_OPTIONS');
