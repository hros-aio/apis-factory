import { AuthContext } from '@new-hros/libs-core';

declare global {
  namespace Express {
    interface Request {
      user?: AuthContext;
      tenantCode?: string;
      sessionId?: stringl
    }
  }
}
