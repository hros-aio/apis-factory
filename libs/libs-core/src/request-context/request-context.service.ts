import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext, AuthContext } from '../interfaces/context.interface';

export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  static run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  static current(): RequestContext | null {
    return this.storage.getStore() || null;
  }

  static getTraceId(): string | null {
    return this.current()?.traceId || null;
  }

  static getRequestId(): string | null {
    return this.current()?.requestId || null;
  }

  static getTenantCode(): string | null {
    return this.current()?.tenantCode || null;
  }

  static getUser(): AuthContext | null {
    return this.current()?.user || null;
  }
}
