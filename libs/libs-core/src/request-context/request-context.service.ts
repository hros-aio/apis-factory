import { AsyncLocalStorage } from 'async_hooks';
import { AuthContext, RequestContext } from '../interfaces/context.interface';

export const DEFAULT_TRACE_ID = '00000000000000000000000000000000';
export const DEFAULT_REQUEST_ID = '00000000000000000000000000000000';
export const DEFAULT_TENANT_CODE = '000000';
export const DEFAULT_USER: AuthContext = {
  userId: '00000000-0000-0000-0000-000000000000',
  sessionId: '00000000-0000-0000-0000-000000000000',
  tenantCode: DEFAULT_TENANT_CODE,
  roles: [],
  scopes: [],
  permissions: [],
};

export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  static readonly DEFAULT_TRACE_ID = DEFAULT_TRACE_ID;
  static readonly DEFAULT_REQUEST_ID = DEFAULT_REQUEST_ID;
  static readonly DEFAULT_TENANT_CODE = DEFAULT_TENANT_CODE;
  static readonly DEFAULT_USER = DEFAULT_USER;

  static run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  static current(): RequestContext | null {
    return this.storage.getStore() || null;
  }

  static getTraceId(): string {
    return this.current()?.traceId || this.DEFAULT_TRACE_ID;
  }

  static getRequestId(): string {
    return this.current()?.requestId || this.DEFAULT_REQUEST_ID;
  }

  static getTenantCode(): string {
    return this.current()?.tenantCode || this.DEFAULT_TENANT_CODE;
  }

  static getUser(): AuthContext {
    return this.current()?.user || this.DEFAULT_USER;
  }
}
